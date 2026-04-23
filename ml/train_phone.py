import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# 1. Load the dataset
print("Loading Phone dataset...")
import os
base_dir = os.path.dirname(os.path.abspath(__file__))
try:
    # Use the preprocessed dataset
    path = os.path.join(base_dir, 'datasets', 'preprocessed', 'phone_preprocessed.csv')
    df = pd.read_csv(path)
except FileNotFoundError:
    print("Error: preprocessed file not found. Trying raw dataset...")
    try:
        path = os.path.join(base_dir, 'datasets', 'phone', 'dataset.csv')
        df = pd.read_csv(path)
    except FileNotFoundError:
        print("Error: No Phone dataset found.")
        exit(1)

# 2. Preprocess the data
# The phone dataset predicts Price (or PriceUSD) based on phone number patterns.
# "Beautiful" or patterned numbers sell for more, so character n-grams are perfect to capture repeating digits.
target_column = 'PriceUSD'
text_column = 'Phone'

if target_column not in df.columns or text_column not in df.columns:
    print(f"Error: Target column '{target_column}' or text column '{text_column}' not found.")
    print("Available columns:", df.columns.tolist())
    exit(1)

# Drop missing values
df = df.dropna(subset=[target_column, text_column])

# Convert Phone column to string just in case pandas read it as int/float
df[text_column] = df[text_column].astype(str)

X = df[text_column]
y = df[target_column]

# 3. Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Initialize Pipeline (TF-IDF + Random Forest Regressor)
# We use a Regressor instead of a Classifier because Price is a continuous number.
# Using 'char' analyzer helps detect repeating digit patterns (e.g., '999', '000') that dictate phone price.
print("Training the Random Forest Regressor on Phone numbers...")
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=1000, analyzer='char', ngram_range=(2, 4))),
    ('regressor', RandomForestRegressor(n_estimators=50, random_state=42, n_jobs=-1))
])

pipeline.fit(X_train, y_train)

# 5. Evaluate the model
print("Evaluating model...")
y_pred = pipeline.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Mean Absolute Error (USD): ${mae:.2f}")
print(f"R-squared (Accuracy of predicting variance): {r2:.2f}")

# 6. Save the trained pipeline
model_filename = "rf_model_phone.pkl"
joblib.dump(pipeline, model_filename)
print(f"Model and Vectorizer saved successfully to {model_filename}")
