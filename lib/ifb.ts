/*
 Initial File Builder(IFB)
*/
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as pg from './passwordGenerator';



export interface IfbProps {
    filePath: string;
    sourceFilePath: string;
    rv:{[name:string]: string};
}

export class Ifb {
    private filePath: string;
    private fileString: string;
    constructor(props: IfbProps) {
        const initialFileSource  = fs.readFileSync(props.sourceFilePath,'utf8');
        this.fileString = pg.replaceStrings(initialFileSource,props.rv);
    }
    public getFilePath(){
        return this.filePath;
    }
    public getString(){
        return this.fileString;
    }
}