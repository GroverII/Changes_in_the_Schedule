Данная часть является клиентской.

Для запуска либо откройте комендную строку и пропишите 
npm start
либо двойной клик по файлу start.bat
Для конечного продукта нужно использовать команду 
npm run build
После этого всё будет оптимизировано. (ВАЖНО - обратного пути нет, если заранее не сделать копию)

На момент написания текста есть 3 маршрута - стандартный(http://localhost:3000/), админменю(http://localhost:3000/admin) и тестовый сайт(http://localhost:3000/Test).
При заходе в админменю потребует логин и пароль -
логин - admin
пароль - admin
Для работы с reCAPTCHA желательно ознакомиться с 
reCAPTCHA Enterprise API.
https://console.cloud.google.com/

Данные на данный момент берутся по данной ссылке -
https://docs.google.com/spreadsheets/d/1MBboSLNI-avCAJ7RZPeJKL-JPIuFY4H9eBoq3W18Qao/edit?usp=sharing
Они не являются достоверными, но структура данных соответствует требуемой

В папке src находятся весь основной код. 
styles.css - распространяется на все страницы.
style_adm.css - только на AdminConsole.js.
Data_table.js - формация для таблицы.
adminToServer.js - некоторые функции прописаны здесь(должно было быть больше, но не успел разделить AdminConsole).
App.js - основная страница. Связана с styles, adminToServer, AdminConsole, Test и Data_table.
AdminConsole.js - страница для админов. Связана с styles, style_adm и adminToServer.
Test.js - страница для тестирования нового. Связана со styles и adminToServer.
Остальные файлы в src были сгенерированы непосредсвенно Node.js + React. Редоктировать не советую, если не знаете что делаете.

