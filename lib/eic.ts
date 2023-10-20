import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';


export interface EicProps {
  securityGroupId: string;
  subnetId: string;
};
export class Eic extends Construct {
  private icEndpoint: ec2.CfnInstanceConnectEndpoint;
  constructor(scope: Construct, id: string, props: EicProps) {
    super(scope, id);
    this.icEndpoint = new ec2.CfnInstanceConnectEndpoint(this,id,{
      subnetId: props.subnetId,
      preserveClientIp: true,
      securityGroupIds:[props.securityGroupId],
    });
  }
  public getEndpoint(){
    return this.icEndpoint;
  }
}

