import joblib
from sklearn.ensemble import RandomForestRegressor
import pandas as pd
import sys
import os

def data_preprocessing(data : pd.DataFrame):
  data[' self_employed'] = data[' self_employed'].map({' No': False, ' Yes': True})
  data[' education'] = data[' education'].map({' Not Graduate': 0, ' Graduate': 1})
  return data


def predict(input_file : str, output_file : str):
  data = pd.read_csv(input_file)
  data = data_preprocessing(data)
  script_dir = os.path.dirname(os.path.realpath(__file__))
  model : RandomForestRegressor = joblib.load(f'{script_dir}/model.pkl')
  data[' loan_status'] = model.predict(data)
  data.to_csv(output_file, index=False)


if __name__ == '__main__':
  if len(sys.argv) < 3:
    print("Please provide the filename as a command line argument.")
    sys.exit(1)

  filename = sys.argv[1]
  output_file = sys.argv[2]

  # filename = "./extern/model/input.csv"
  # output_file = "./extern/model/output.csv"

  predict(filename, output_file)
  exit(0)

