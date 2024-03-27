import { VerifyAuthChallengeResponseTriggerEvent } from "aws-lambda";
import { Context } from "aws-sdk/clients/autoscaling";

export default async function defineAuthChallenge(
  event: VerifyAuthChallengeResponseTriggerEvent,
  context: Context
) {
  const expectedAnswer =
    event?.request.privateChallengeParameters.secretLoginCode;
  event.response.answerCorrect =
    event.request.challengeAnswer === expectedAnswer;

  return event;
}
