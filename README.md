# AWS Cognito OTP lambda

This is a serverless lambda using the serverless framework that implements basic One Time Password (OTP) for AWS Cognito using cognito lambda triggers. It is based on the blog post: <https://theburningmonk.com/2023/03/passwordless-authentication-made-easy-with-cognito-a-step-by-step-guide/>

## How it works

This lambda is triggered when a user signs up for a new account. It will generate a random 6 digit OTP code and send it to the user's email address. The user will be prompted to enter the OTP code to complete the sign up process. If the code is not entered in a timely manner (default 5 minutes), the user's account will be cancelled.

## Setup

This repository assumes you have basic knowledge of AWS Cognito and the Serverless framework. If not, please read the relevant documentation before continuing.

1. Create a new AWS Cognito user pool.
2. Enable the "Mandatory Sign-in" setting.
3. Create a new AWS IAM role for your lambda function and attach the following policy to it:
