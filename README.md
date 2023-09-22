# Component library infra

This project is used to deploy the component library infrastructure to AWS. The library can be found on https://componenten.nijmegen.nl. Unlike most of our projects, the application code is part of a different repository (for legacy reasons): [component-library](https://github.com/GemeenteNijmegen/component-library). This project consists of:
- An s3 bucket for static website hosting
- A cloudfront distribution for access
- An IAM user with access to the S3 bucket for deployment (from the content repository).
