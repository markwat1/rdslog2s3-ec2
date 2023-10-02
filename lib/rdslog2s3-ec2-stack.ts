import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2} from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { execSync } from 'child_process';

import { Ec2Instance} from './ec2';
import { Eic } from './eic';
import { Vpc } from './vpc';
import * as fs from 'fs';
import * as pg from './passwordGenerator';
import { Ifb } from './ifb';
import { S3_SERVER_ACCESS_LOGS_USE_BUCKET_POLICY } from 'aws-cdk-lib/cx-api';


export class Rdslog2S3Ec2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Virtual Private Cloud(VPC)
    const availabilityZones = ['ap-northeast-1c'];
    const vpc = new Vpc(this,'bakupRdsLogs',{
      availabilityZones: availabilityZones,
    });
    // Security Group
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'ec2-sg',{
      vpc:vpc.getVpc(),
      allowAllOutbound: true,
      allowAllIpv6Outbound: true,
      securityGroupName:'ec2-sg',
    });
    const eicSecurityGroup = new ec2.SecurityGroup(this,'eic-sg',{
      vpc:vpc.getVpc(),
      allowAllOutbound: false,
      securityGroupName:'eic-sg'
    })
    ec2SecurityGroup.addIngressRule(eicSecurityGroup,ec2.Port.tcp(22));
    eicSecurityGroup.addEgressRule(ec2SecurityGroup,ec2.Port.tcp(22));
    // s3 bucket
    const s3_bucket = new s3.Bucket(this,'rdslogbucket',{
      removalPolicy:cdk.RemovalPolicy.DESTROY
    });
    // rds log access role
    const rdsLogPolicy = new iam.Policy(this,'RDSLogFile',{
      statements:[new iam.PolicyStatement({
        effect:iam.Effect.ALLOW,
        actions:[
          "rds:DownloadDBLogFilePortion",
          "rds:DownloadCompleteDBLogFile",
          "rds:DescribeDBLogFiles",
          "s3:PutObject",
        ],
        resources:["*"]
      })]
    });
    const rdsLogRole = new iam.Role(this,'RDSLogFileRole',{
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    rdsLogRole.attachInlinePolicy(rdsLogPolicy);
    // build sender Instances
    const initFileBuilder = new Ifb({
      filePath: '/home/ec2-user/storeRdsLog.sh',
      sourceFilePath: './lib/storeRdsLog.sh',
      rv:{
        __DATABASE_ID__: 'database-2-instance-1',
        __REGION__: 'ap-northeast-1',
        __S3_BUCKET__: s3_bucket.bucketName,
      },
    });
    let ec2Instances:Ec2Instance[] = [];
    for(const az of availabilityZones){
      ec2Instances.push( new Ec2Instance(this,'rdslogserver-' + az,{
        vpc: vpc.getVpc(),
        name:'forwarder' + az,
        availabilityZone: az,
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        instanceClass: ec2.InstanceClass.T4G,
        instanceSize: ec2.InstanceSize.NANO,
        ec2SecurityGroup: ec2SecurityGroup,
        init: ec2.CloudFormationInit.fromElements(
          initFileBuilder.getInit(),
        ),
        role:rdsLogRole,
      }));
    }
    const userData = fs.readFileSync('./lib/ud/ud.sh','utf8');
    for(const instance of ec2Instances){
      instance.getInstance().addUserData(userData);
    }
    // EIC
    new Eic(this,'eic',{
      securityGroupId:eicSecurityGroup.securityGroupId,
      subnetId:vpc.getVpc().selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds[0],
    });
  }
}
