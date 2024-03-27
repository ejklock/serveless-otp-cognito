import { APIGatewayProxyEvent } from "aws-lambda/trigger/api-gateway-proxy";

export default async function hello(event: APIGatewayProxyEvent) {
  return {
    statusCode: 200,
    body: "Hello World",
    isBase64Encoded: false,
  };
}
