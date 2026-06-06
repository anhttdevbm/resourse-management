"""Define S3torage."""
import io
import logging
from typing import Optional
import boto3
from botocore.client import Config
from botocore.exceptions import NoCredentialsError


class S3Storage:
    """Define S3torage."""

    def __init__(self, s3_host: str, s3_public_key: str, s3_secret_key: str, s3_bucket: str, s3_region: str):
        """Define init."""
        self.s3_bucket = s3_bucket
        print(f"🔧 S3 Init - Host: {s3_host}, Bucket: {s3_bucket}, Key: {s3_public_key[:8]}...")
        
        session = boto3.Session(aws_access_key_id=s3_public_key, aws_secret_access_key=s3_secret_key)
        self.client = session.client("s3",
                                     endpoint_url=s3_host,
                                     region_name=s3_region,
                                     config=Config(
                                         signature_version='s3v4',
                                         connect_timeout=5,
                                         read_timeout=10,
                                         retries={'max_attempts': 1}
                                     ))
        print(f"✅ S3 client created successfully")

    def upload_file(self, local_file_path, s3_file_path):
        """Define upload file."""
        try:
            self.client.upload_file(local_file_path, self.s3_bucket, s3_file_path)
            print("Upload Successful")
            return True
        except FileNotFoundError:
            print("The file was not found")
            return False
        except NoCredentialsError:
            print("Credentials not available")
            return False

    def download_file(self, s3_file_path, local_file_path):
        """Define download file."""
        try:
            self.client.download_file(self.s3_bucket, s3_file_path, local_file_path)
            print("Download Successful")
            return True
        except FileNotFoundError:
            print("The file was not found")
            return False
        except NoCredentialsError:
            print("Credentials not available")
            return False

    def put_object(self, object_name: str, data: bytes) -> None:
        """Define put object."""
        try:
            print(f"🔗 S3 Config - Host: {self.client._endpoint.host}, Bucket: {self.s3_bucket}")
            
            # Test connection first
            print(f"🔍 Testing S3 connection...")
            self.client.head_bucket(Bucket=self.s3_bucket)
            print(f"✅ S3 connection test successful")
            
            print(f"📤 Uploading {object_name} ({len(data)} bytes)...")
            
            self.client.upload_fileobj(
                io.BytesIO(data),
                Bucket=self.s3_bucket, 
                Key=object_name,
                Config=boto3.s3.transfer.TransferConfig(
                    multipart_threshold=1024 * 25,
                    max_concurrency=10,
                    multipart_chunksize=1024 * 25,
                    use_threads=True
                )
            )
            print(f"✅ S3 upload successful: {object_name}")
            logging.info(f"Push {object_name} to bucket {self.s3_bucket} done")
        except Exception as e:
            print(f"❌ S3 upload error: {str(e)}")
            print(f"❌ Error type: {type(e).__name__}")
            raise

    def get_object(self, object_name: str) -> Optional[bytes]:
        """Define get object."""
        file_obj = self.client.get_object(Bucket=self.s3_bucket, Key=object_name)
        file_content = file_obj["Body"].read()
        logging.info(f"Get object {object_name} from bucket {self.s3_bucket} done")
        return bytes(file_content)

    def generate_presigned_url(self, object_name: str, expiration: int = 3600) -> str:
        """Generate presigned URL for object access."""
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.s3_bucket, 'Key': object_name},
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            logging.error(f"Error generating presigned URL: {str(e)}")
            raise

    def delete_object(self, object_name: str) -> bool:
        """Delete object from S3."""
        try:
            self.client.delete_object(Bucket=self.s3_bucket, Key=object_name)
            logging.info(f"Deleted object {object_name} from bucket {self.s3_bucket}")
            return True
        except Exception as e:
            logging.error(f"Error deleting object {object_name}: {str(e)}")
            # Don't raise, just log - old avatar might not exist
            return False