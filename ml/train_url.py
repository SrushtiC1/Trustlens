import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report
import joblib

# 1. Load the dataset
print("Loading URL dataset...")
import os
base_dir = os.path.dirname(os.path.abspath(__file__))
try:
    # Use the preprocessed dataset
    path = os.path.join(base_dir, 'datasets', 'preprocessed', 'url_preprocessed.csv')
    df = pd.read_csv(path)
except FileNotFoundError:
    print("Error: preprocessed file not found. Trying raw dataset...")
    try:
        path = os.path.join(base_dir, 'datasets', 'url', 'dataset.csv')
        df = pd.read_csv(path)
    except FileNotFoundError:
        print("Error: No URL dataset found.")
        exit(1)

# 2. Preprocess the data
target_column = 'type'
text_column = 'url'

if target_column not in df.columns or text_column not in df.columns:
    print(f"Error: Target column '{target_column}' or text column '{text_column}' not found.")
    print("Available columns:", df.columns.tolist())
    exit(1)

# Drop missing values
df = df.dropna(subset=[target_column, text_column])

X = df[text_column]
y = df[target_column]

# 3. Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Initialize Pipeline (TF-IDF + Random Forest)
print("Training the Random Forest model with TF-IDF Vectorization...")
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000, analyzer='char_wb', ngram_range=(2, 4))),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
])

pipeline.fit(X_train, y_train)

# 5. Evaluate the model
print("Evaluating model...")
y_pred = pipeline.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
print("\nClassification Report:\n", classification_report(y_test, y_pred))

# 6. Save the trained pipeline
model_filename = "rf_model_url.pkl"
joblib.dump(pipeline, model_filename)
print(f"Model and Vectorizer saved successfully to {model_filename}")
