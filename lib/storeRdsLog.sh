#!/bin/bash
for f in $(aws rds describe-db-log-files --db-instance-identifier __DATABASE_ID__ --region __REGION__ --out json|jq -r '.DescribeDBLogFiles[].LogFileName');do
    aws rds download-db-log-file-portion --db-instance-identifier __DATABASE_ID__ --region __REGION__ --log-file-name $f --starting-token 0 --no-paginate --output text |gzip > $f.gz
    aws s3 cp $f.gz s3://__S3_BUCKET__/$f.gz
done
