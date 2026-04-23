import sys
import argparse
import json
import joblib
import os

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", required=True, help="Type of entity (URL, Website, Phone)")
    parser.add_argument("--entity", required=True, help="The string entity to predict")
    args = parser.parse_args()

    entity_type = args.type.lower()
    entity = args.entity

    # Get the directory of this script so we can load .pkl files relative to it
    base_dir = os.path.dirname(os.path.abspath(__file__))

    model_path = ""
    if entity_type == 'url':
        model_path = os.path.join(base_dir, 'rf_model_url.pkl')
    elif entity_type == 'website':
        model_path = os.path.join(base_dir, 'rf_model_website.pkl')
    elif entity_type == 'phone':
        model_path = os.path.join(base_dir, 'rf_model_phone.pkl')
    else:
        print(json.dumps({"success": False, "error": f"Unknown entity type: {entity_type}"}))
        sys.exit(1)

    if not os.path.exists(model_path):
        print(json.dumps({"success": False, "error": f"Model file not found: {model_path}"}))
        sys.exit(1)

    try:
        # Load the saved Pipeline (Vectorizer + Random Forest)
        pipeline = joblib.load(model_path)
        
        # Pipelines expect an iterable of strings
        prediction = pipeline.predict([entity])
        
        # prediction is a numpy array. Take the first element.
        result = str(prediction[0])
        
        print(json.dumps({
            "success": True, 
            "prediction": result,
            "type": entity_type
        }))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
