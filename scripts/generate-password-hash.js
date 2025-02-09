import bcrypt from 'bcryptjs';

const password = 'Admin123!';

bcrypt.genSalt(10).then(salt => {
  return bcrypt.hash(password, salt);
}).then(hash => {
  console.log('Hash for password:', password);
  console.log('Hash:', hash);
}).catch(console.error);
