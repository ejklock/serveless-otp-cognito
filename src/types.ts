export type ChallengeMetadata =
  | {
      challenge: "CHOOSE_EMAIL_OR_SMS";
    }
  | {
      challenge: "PROVIDE_SECRET_CODE";
      secretLoginCode: string;
    };
