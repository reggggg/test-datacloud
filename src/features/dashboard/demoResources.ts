import type { Resource } from './resources'

export const demoDate = new Date('2026-11-25T12:00:00Z')
const fixtures: [string, string, string, string, number, string, string][] = [
  ['ec2-prod-web-01', 'Compute', 'Amazon EC2', 'us-east-1', 1840, 'Active', '2026-11-22'],
  ['rds-prod-primary', 'Database', 'Amazon RDS', 'us-east-1', 1260, 'Active', '2026-11-19'],
  ['s3-analytics-archive', 'Storage', 'Amazon S3', 'us-west-2', 385, 'Active', '2026-11-17'],
  ['cdn-global-edge', 'Networking', 'CloudFront', 'eu-west-1', 212, 'Active', '2026-11-12'],
  ['ec2-staging-worker', 'Compute', 'Amazon EC2', 'eu-west-1', 148, 'Stopped', '2026-11-07'],
  ['rds-reporting-replica', 'Database', 'Amazon RDS', 'ap-southeast-1', 690, 'Active', '2026-10-27'],
  ['s3-ingestion-store', 'Storage', 'Amazon S3', 'us-east-1', 470, 'Active', '2026-10-21'],
  ['ec2-prod-web-02', 'Compute', 'Amazon EC2', 'us-west-2', 890, 'Active', '2026-10-13'],
  ['lb-prod-public', 'Networking', 'Elastic Load Balancing', 'us-east-1', 300, 'Active', '2026-10-08'],
  ['s3-backup-eu', 'Storage', 'Amazon S3', 'eu-west-1', 160, 'Active', '2026-09-26'],
  ['ec2-edge-workers', 'Compute', 'Amazon EC2', 'ap-southeast-1', 606, 'Active', '2026-09-14'],
  ['rds-events-primary', 'Database', 'Amazon RDS', 'eu-west-1', 530, 'Active', '2026-09-09'],
  ['nat-private-apps', 'Networking', 'Amazon VPC', 'us-east-1', 245, 'Active', '2026-08-24'],
  ['ec2-batch-01', 'Compute', 'Amazon EC2', 'us-west-2', 315, 'Active', '2026-08-21'],
  ['s3-monthly-reports', 'Storage', 'Amazon S3', 'us-east-1', 225, 'Active', '2026-08-08'],
  ['rds-orders-read', 'Database', 'Amazon RDS', 'us-east-1', 615, 'Active', '2026-08-02'],
  ['ec2-catalog-api', 'Compute', 'Amazon EC2', 'us-east-1', 475, 'Active', '2026-07-28'],
  ['s3-static-media', 'Storage', 'Amazon S3', 'us-west-2', 230, 'Active', '2026-07-14'],
  ['cdn-assets', 'Networking', 'CloudFront', 'ap-southeast-1', 155, 'Active', '2026-07-03'],
  ['rds-staging-db', 'Database', 'Amazon RDS', 'eu-west-1', 238, 'Stopped', '2026-06-24'],
  ['ec2-core-services', 'Compute', 'Amazon EC2', 'us-east-1', 1490, 'Active', '2026-06-19'],
  ['s3-production-data', 'Storage', 'Amazon S3', 'us-east-1', 870, 'Active', '2026-06-13'],
  ['s3-archive-apac', 'Storage', 'Amazon S3', 'ap-southeast-1', 410, 'Active', '2026-06-08'],
  ['rds-core-replica', 'Database', 'Amazon RDS', 'us-west-2', 925, 'Active', '2026-05-22'],
]

export const demoResources: Resource[] = fixtures.map(
  ([resource_key, resource_type, service_name, region, monthly_cost, status, created_at]) =>
    ({ resource_key, resource_type, service_name, region, monthly_cost, status, created_at }),
)
