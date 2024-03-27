import { DefineAuthChallengeTriggerEvent } from "aws-lambda";
import { Context } from "aws-sdk/clients/autoscaling";
import { MAX_ATTEMPTS } from "../constants.js";

export default async function defineAuthChallenge(
  event: DefineAuthChallengeTriggerEvent,
  context: Context
) {
  const attempts = event?.request?.session?.length || 0;

  const lastAttempt = event?.request?.session[attempts - 1];

  let issueTokens = false;
  let failAuthentication = false;
  let challengeName = "CUSTOM_CHALLENGE";

  if (
    event?.request?.session.some(
      (attempt: any) => attempt.challengeName !== "CUSTOM_CHALLENGE"
    )
  ) {
    failAuthentication = true;
  } else if (
    attempts >= MAX_ATTEMPTS &&
    lastAttempt.challengeResult === false
  ) {
    failAuthentication = true;
  } else if (
    attempts >= 1 &&
    lastAttempt.challengeName === "CUSTOM_CHALLENGE" &&
    lastAttempt.challengeResult === true
  ) {
    issueTokens = true;
  }

  event.response = {
    issueTokens,
    failAuthentication,
    challengeName,
  };

  return event;
}
