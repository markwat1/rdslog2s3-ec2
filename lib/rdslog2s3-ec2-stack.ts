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

    // build sender Instances
    const initFileBuilder = new Ifb({
      filePath: '/etc/initial.conf',
      sourceFilePath: './lib/conf/initial.conf',
      rv:{
        __FORWARDER_IP_ADDRESS__: 'ipaddress',
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
          ec2.InitFile.fromString(initFileBuilder.getFilePath(),initFileBuilder.getString()),
        ),
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
