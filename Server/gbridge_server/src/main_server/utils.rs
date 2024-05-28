use std::process::Command;
use std::fs::File;
use csv::Reader;

pub fn predict(no_of_dependents:i64,
graduated:bool,
self_employed:bool,
income_annum:f64,
loan_amount:f64,
loan_term:f64,
cibil_score:f64,
residential_assets_value:f64,
commercial_assets_value:f64,
luxury_assets_value:f64,
bank_asset_value:f64,
)
-> f64 
{
  use std::io::prelude::*;

  // Save parameters to a CSV file
  let input_path = "./extern/model/input.csv";
  let output_path = "./extern/model/output.csv";
  let mut file = File::create(input_path).expect("Failed to create file");
  let education = if graduated { " Graduate" } else { " Not Graduate" };
  let self_employed = if self_employed { " Yes" } else { " No" };



  writeln!(file, 
" no_of_dependents, education, self_employed, income_annum, loan_amount, \
loan_term, cibil_score, residential_assets_value, commercial_assets_value, \
luxury_assets_value, bank_asset_value").expect("Failed to write to file");
  writeln!(file, "{},{},{},{},{},{},{},{},{},{},{}", no_of_dependents, education, self_employed, income_annum, loan_amount, loan_term, cibil_score, residential_assets_value, commercial_assets_value, luxury_assets_value, bank_asset_value).expect("Failed to write to file");

  
  
  let output = Command::new("python")
    .arg("./extern/model/model.py")
    .arg(input_path)
    .arg(output_path)
    .output()
    .expect("Failed to execute command");

  assert!(output.status.success());

  let mut reader = Reader::from_path(output_path).expect("Failed to read CSV file");

  let mut score = 0.0;

  for result in reader.records() {
    let record = result.expect("Failed to read record");
    // Now you can access the fields in the record
    let last_item = record.get(11);
    score = last_item.unwrap().parse::<f64>().unwrap();
  }
  return score;
}