use regex::Regex;
#[allow(dead_code)]

/// Checks if a username is valid.
/// A valid username consists of 4 to 10 alphanumeric characters or underscores.
pub fn check_username_validity(username: &String) -> bool {
    let re = Regex::new(r"^[a-zA-Z0-9_]{4,10}$").unwrap();
    re.is_match(username)
}

#[allow(dead_code)]
/// Checks if a username is valid.
/// A valid username consists of 6 to 12 characters
pub fn check_password_validity(password: &String) -> bool {
  let regex = r#"^.{6,12}$"#;
  let re = Regex::new(&regex).unwrap();
  re.is_match(password)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_username_validity() {
    // Existing test case
    assert_eq!(check_username_validity(&String::from("john_doe")), true);

    // Additional test case: username with less than 4 characters
    assert_eq!(check_username_validity(&String::from("abc")), false);

    // Additional test case: username with more than 10 characters
    assert_eq!(check_username_validity(&String::from("username1234")), false);

    // Additional test case: username with special characters
    assert_eq!(check_username_validity(&String::from("user@name")), false);

    // Additional test case: valid username
    assert_eq!(check_username_validity(&String::from("user_name")), true);
  }

  #[test]
  fn test_password_validity() {
    // Existing test case
    assert_eq!(check_password_validity(&String::from("password\\")), true);

    // Additional test case: password with less than 6 characters
    assert_eq!(check_password_validity(&String::from("abc")), false);

    // Additional test case: password with more than 12 characters
    assert_eq!(check_password_validity(&String::from("password12345")), false);

    // Additional test case: password with special characters
    assert_eq!(check_password_validity(&String::from("pa\"ssw`od@3")), true);

    // Additional test case: valid password
    assert_eq!(check_password_validity(&String::from("passwo rd")), true);
  }
}