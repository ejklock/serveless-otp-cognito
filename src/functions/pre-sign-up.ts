import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import { Callback, Context, PreSignUpTriggerEvent } from "aws-lambda";

export const handler = async (
  event: PreSignUpTriggerEvent,
  context: Context,
  callback: Callback
) => {
  if (await currentUserExists(event)) {
    console.log("Current user already exists", { ...event });
    throw new Error("User already exists.");
  }

  event.response = {
    autoConfirmUser: true,
    autoVerifyPhone: true,
    autoVerifyEmail: true,
  };

  console.log("Event after update: ", { ...event });

  return event;
};

const currentUserExists = async (
  event: PreSignUpTriggerEvent
): Promise<boolean> => {
  const identityProvider = new CognitoIdentityProvider();
  const userPoolId = event.userPoolId;
  const { email, phone_number } = event.request.userAttributes;

  try {
    console.log("Get user by email: ", { email });
    await identityProvider.adminGetUser({
      UserPoolId: userPoolId,
      Username: email,
    });
    return true;
  } catch (error) {
    console.log("Error get user by email: ", error);
  }

  try {
    console.log("Get user by phone number: ", { phone_number });
    await identityProvider.adminGetUser({
      UserPoolId: userPoolId,
      Username: phone_number,
    });
    return true;
  } catch (error) {
    console.log("Error get user by phone number: ", error);
  }

  return false;
};
