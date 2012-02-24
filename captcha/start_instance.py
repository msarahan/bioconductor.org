#!/usr/bin/env python


import sys

argc = len(sys.argv)
if argc != 2:
    print("supply an AMI ID")
    sys.exit(1)
    
ami_id = sys.argv[1]

import time
import ConfigParser
from boto.ec2.connection import EC2Connection

config_file = "%s/credentials.cfg" % sys.path[0]

config = ConfigParser.RawConfigParser()
config.read(config_file)

access_key = config.get("credentials", "access_key")
secret_key = config.get("credentials", "secret_key")

conn = EC2Connection(access_key, secret_key)

reservation = conn.run_instances(ami_id,
    key_name='bioc-default',
    instance_type='t1.micro',
    security_groups=['rstudio-only'])
    
instance = reservation.instances[0]

instance.add_tag("Name", "tryitnow")

while True:
        desc = conn.get_all_instances([instance.id])
        if desc[0].instances[0].state == "running":
            ip = desc[0].instances[0].public_dns_name
            print(ip)
            sys.exit(0)
        time.sleep(1)


