import pandas as pd
import re
import os

def clean_url(url):
    # Lowercase and remove protocol
    url = str(url).lower()
    url = re.sub(r'https?://(www\.)?', '', url)
    return url

def clean_phone(phone):
    # Keep only digits
    phone = str(phone)
    phone = re.sub(r'\D', '', phone)
    return phone

def clean_text(text):
    # Basic cleaning for website body
    text = str(text).lower()
    text = re.sub(r'<.*?>', '', text) # Remove HTML tags
    text = re.sub(r'[^a-zA-Z\s]', '', text) # Remove special characters
    return text

def preprocess_all(datasets_dir="datasets"):
    preprocessed_dir = os.path.join(datasets_dir, "preprocessed")
    if not os.path.exists(preprocessed_dir):
        os.makedirs(preprocessed_dir)

    # 1. Preprocess URL Dataset
    url_path = os.path.join(datasets_dir, "url", "dataset.csv")
    if os.path.exists(url_path):
        print("Preprocessing URL dataset...")
        df_url = pd.read_csv(url_path)
        if 'url' in df_url.columns:
            df_url['url'] = df_url['url'].apply(clean_url)
            # Remove any empty URLs after cleaning
            df_url = df_url[df_url['url'] != '']
            output_path = os.path.join(preprocessed_dir, "url_preprocessed.csv")
            df_url.to_csv(output_path, index=False)
            print(f"Saved preprocessed URL dataset to {output_path}")
        else:
            print("Error: 'url' column not found in URL dataset.")
    else:
        print(f"URL dataset not found at {url_path}")

    # 2. Preprocess Phone Dataset
    phone_path = os.path.join(datasets_dir, "phone", "dataset.csv")
    if os.path.exists(phone_path):
        print("Preprocessing Phone dataset...")
        df_phone = pd.read_csv(phone_path)
        if 'Phone' in df_phone.columns:
            df_phone['Phone'] = df_phone['Phone'].apply(clean_phone)
            # Remove any empty phone numbers after cleaning
            df_phone = df_phone[df_phone['Phone'] != '']
            output_path = os.path.join(preprocessed_dir, "phone_preprocessed.csv")
            df_phone.to_csv(output_path, index=False)
            print(f"Saved preprocessed Phone dataset to {output_path}")
        else:
            print("Error: 'Phone' column not found in Phone dataset.")
    else:
        print(f"Phone dataset not found at {phone_path}")

    # 3. Preprocess Website Dataset
    website_path = os.path.join(datasets_dir, "website", "dataset.csv")
    if os.path.exists(website_path):
        print("Preprocessing Website dataset...")
        df_website = pd.read_csv(website_path)
        if 'body' in df_website.columns and 'label' in df_website.columns:
            df_website['body'] = df_website['body'].apply(clean_text)
            # Remove any empty bodies after cleaning
            df_website = df_website[df_website['body'] != '']
            output_path = os.path.join(preprocessed_dir, "website_preprocessed.csv")
            df_website.to_csv(output_path, index=False)
            print(f"Saved preprocessed Website dataset to {output_path}")
        else:
            print("Error: 'body' or 'label' column not found in Website dataset.")
    else:
        print(f"Website dataset not found at {website_path} (Skipping)")

if __name__ == "__main__":
    # Adjust path if running from 'ml' directory
    current_dir = os.getcwd()
    if os.path.basename(current_dir) == 'ml':
        preprocess_all("datasets")
    else:
        preprocess_all("ml/datasets")
