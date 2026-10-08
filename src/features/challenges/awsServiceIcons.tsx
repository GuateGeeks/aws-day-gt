import "./aws-service-options.css";

/** AWS Architecture Icons, July 2026: https://aws.amazon.com/architecture/icons/ */
const iconIds = new Set([
  "api-gateway", "bedrock", "cloudfront", "cloudwatch", "dynamodb", "ebs",
  "ec2", "eventbridge", "iam", "lambda", "rds", "route53", "s3",
  "sns", "sqs", "step-functions"
]);

export function serviceIconSrc(id: string): string | undefined {
  const normalized = id === "dynamo" ? "dynamodb" : id;
  return iconIds.has(normalized) ? `/aws-services/${normalized}.svg` : undefined;
}

export function AwsServiceIcon({ id, className = "" }: { id: string; className?: string }) {
  const src = serviceIconSrc(id);
  return src ? <img className={`aws-service-icon ${className}`.trim()} src={src} alt="" aria-hidden="true" draggable={false} /> : null;
}
