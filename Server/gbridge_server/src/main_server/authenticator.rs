use chrono;
use lettre::message::Mailbox;
use rand::Rng;
use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};


struct VerificationEntry
{
    _email: String,
    verification_code: String,
    time: chrono::DateTime<chrono::Utc>,
}

impl VerificationEntry
{
  fn new(email: String, verification_code: String) -> VerificationEntry
  {
    VerificationEntry
    {
      _email: email,
      verification_code,
      time: chrono::Utc::now(),
    }
  }
}

pub struct Authenticator
{
  verification_entries: std::collections::HashMap<String, VerificationEntry>,
  mailer: SmtpTransport,
}

impl Authenticator
{
  fn generate_verification_code(&mut self) -> String
  {
    let rng = &mut rand::thread_rng();
    static CHARSET: &[u8; 10] = b"0123456789";
    let verification_code: String = (0..6)
      .map(|_| {
        let idx = rng.gen_range(0..CHARSET.len());
        CHARSET[idx] as char
      })
      .collect();
    verification_code
  }

  pub fn new() -> Authenticator
  {
    let creds = 
    Credentials::new("doverhi".to_owned(),
    "ORRSCLCBOGWFBPPE".to_owned());

    // Open a remote connection to gmail
    let mailer = SmtpTransport::relay("smtp.163.com")
        .unwrap()
        .credentials(creds)
        .build();

    Authenticator
    {
      verification_entries: std::collections::HashMap::new(),
      mailer: mailer
    }
  }

  pub fn send_verification_email(&mut self, email: String)
  -> Result<(),()>
  {
    let mbox : Result<Mailbox, _> = email.parse();
    if mbox.is_err()
    {
      return Err(());
    }
    let mbox = mbox.unwrap();

    let vericode = self.generate_verification_code();

    let email_to_send = Message::builder()
    .from("DoverHi <doverhi@163.com>".parse().unwrap())
    .to(mbox)
    .subject("Gbridge Verification Code")
    .header(ContentType::TEXT_PLAIN)
    .body(String::from(format!("Your verification code is {}. Valid in 5 minutes.
    Don't reply if you didn't request this.",
    vericode))
    );
    if email_to_send.is_err()
    {
      return Err(());
    }
    let email_to_send = email_to_send.unwrap();
    match self.mailer.send(&email_to_send) {
        Ok(_) => println!("Email sent successfully!"),
        Err(e) => panic!("Could not send email: {e:?}"),
    }
    self.verification_entries
    .insert(email.clone(), VerificationEntry::new(email, vericode));
    Ok(())
  }

  pub fn clear_outdated_entries(&mut self)
  {
    let now = chrono::Utc::now();
    self.verification_entries.retain(|_, entry| {
      let duration = now.signed_duration_since(entry.time);
      duration.num_minutes() < 5
    });
  }

  pub fn verify(&mut self, email: String, verification_code: String) -> bool
  {
    self.clear_outdated_entries();
    if let Some(entry) = self.verification_entries.get(&email)
    {
      if entry.verification_code == verification_code
      {
        return true;
      }
    }
    false
  }

}