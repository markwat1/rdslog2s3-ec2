/*
 Initial File Builder(IFB)
*/
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as utils from './utils';
import {aws_ec2 as ec2 } from 'aws-cdk-lib';

export interface IfbProps {
    filePath: string;
    sourceFilePath: string;
    rv:{[name:string]: string};
}

export class Ifb {
    private filePath: string;
    private fileString: string;
    private init: ec2.InitFile;
    constructor(props: IfbProps) {
        this.filePath = props.filePath;
        const initialFileSource  = fs.readFileSync(props.sourceFilePath,'utf8');
        this.fileString = utils.replaceStrings(initialFileSource,props.rv);
        this.init = ec2.InitFile.fromString(this.filePath,this.fileString);
    }
    public getInit(){
        return this.init;
    }
    public getFilePath(){
        return this.filePath;
    }
    public getString(){
        return this.fileString;
    }
}
