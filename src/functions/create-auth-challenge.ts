import { SES } from "@aws-sdk/client-ses";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { Context, CreateAuthChallengeTriggerEvent } from "aws-lambda";
import { SendEmailRequest } from "aws-sdk/clients/ses";
import { customAlphabet } from "nanoid";
import { MAX_ATTEMPTS } from "../constants.js";
import { ChallengeMetadata } from "../types.js";

const generateOTPCode = () => {
  const nanoid = customAlphabet("0123456789", 8);
  return nanoid();
};
export default async function createAuthChallenge(
  event: CreateAuthChallengeTriggerEvent,
  context: Context
) {
  if (!event.request.session?.length) {
    return askUserToChooseChannelToReceiveOtpCode(event);
  }

  const lastResponse = event.request.session.slice(-1)[0];
  const lastChallenge = JSON.parse(
    lastResponse.challengeMetadata!
  ) as ChallengeMetadata;

  if (lastChallenge?.challenge === "CHOOSE_EMAIL_OR_SMS") {
    console.log("USER SELECTED CHANNEL STEP", {
      metadata: event.request.clientMetadata,
    });

    const receiveCodeOn =
      event.request.clientMetadata?.receiveCodeOn || "email";

    return generateOtpAndSendToUserSelectedChannel(event, receiveCodeOn);
  }

  if (lastChallenge?.challenge === "PROVIDE_SECRET_CODE") {
    console.log(JSON.stringify(event, null, 2));

    return respondToSecretLoginCode(event, lastChallenge.secretLoginCode);
  }

  return event;
}

function askUserToChooseChannelToReceiveOtpCode(
  event: CreateAuthChallengeTriggerEvent
) {
  console.log("CHOOSE_EMAIL_OR_SMS STEP");
  const publicChallengeParameters = { challenge: "CHOOSE_EMAIL_OR_SMS" };
  event.response = {
    challengeMetadata: JSON.stringify(
      publicChallengeParameters as ChallengeMetadata
    ),
    privateChallengeParameters: {},
    publicChallengeParameters,
  };
  console.log(JSON.stringify(event, null, 2));
  return event;
}

async function generateOtpAndSendToUserSelectedChannel(
  event: CreateAuthChallengeTriggerEvent,
  receiveCodeOn: string
) {
  console.log("GENERATE OTP AND SEND TO USER SELECTED CHANNEL STEP");
  console.log(JSON.stringify(event, null, 2));
  const otpCode = generateOTPCode();
  const userEmail = event?.request?.userAttributes?.email;
  const userPhoneNumber = event?.request?.userAttributes?.phone_number;

  console.log({
    otpCode,
    userEmail,
    userPhoneNumber,
    receiveCodeOn,
  });

  if (receiveCodeOn === "email") {
    await sendEmail(userEmail, otpCode);
  } else if (receiveCodeOn === "phone") {
    await sendSMS(userPhoneNumber, otpCode);
  } else {
    console.log("NOT FOUND RECEIVE CODE ON, SEND EVENT AGAIN");
    return askUserToChooseChannelToReceiveOtpCode(event);
  }

  return respondToSecretLoginCode(event, otpCode);
}

async function respondToSecretLoginCode(
  event: CreateAuthChallengeTriggerEvent,
  otpCode: string
) {
  console.log("RESPOND TO SECRET LOGIN CODE STEP");
  const attempts = event?.request?.session?.length || 0;
  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const publicChallengeParameters = {
    challenge: "PROVIDE_SECRET_CODE",
    maxAttempts: `${MAX_ATTEMPTS}`,
    attempts: `${attempts}`,
    attemptsLeft: `${attemptsLeft}`,
  };
  const challengeMetadata = {
    ...publicChallengeParameters,
    secretLoginCode: otpCode,
  } as ChallengeMetadata;

  event.response = {
    challengeMetadata: JSON.stringify(challengeMetadata),
    privateChallengeParameters: {
      secretLoginCode: otpCode,
    },
    publicChallengeParameters,
  };

  return event;
}

async function sendSMS(phoneNumber: string, otpCode: string) {
  console.log("SEND SMS STEP");
  const client = new SNSClient();
  const message = `Your one-time login code: ${otpCode}`;

  await client.send(
    new PublishCommand({
      Message: message,
      PhoneNumber: phoneNumber,
    })
  );
}
async function sendEmail(emailAddress: string, otpCode: string) {
  console.log("SEND EMAIL STEP");
  const ses = new SES({ region: "us-east-1" });
  const params: SendEmailRequest = {
    Source: "no-reply@klocktecnologia.com",
    Destination: {
      ToAddresses: [emailAddress],
    },
    Message: {
      Subject: {
        Data: "Your one-time login code",
        Charset: "utf-8",
      },
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: `Your one-time login code: ${otpCode}`,
        },
        Html: {
          Charset: "UTF-8",
          Data: `<html><body><p>This is your one-time login code:</p>
                  <h3>${otpCode}</h3></body></html>`,
        },
      },
    },
  };
  try {
    await ses.sendEmail(params);
  } catch (err: any) {
    throw new Error(err.message);
  }
}
