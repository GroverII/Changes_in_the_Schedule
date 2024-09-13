const express = require('express');
const fs = require('fs');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
const postcss = require('postcss');
const util = require('util');
const crypto = require('crypto');
const readdir = util.promisify(fs.readdir);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

//���������� � ������ ������, ������������ � ������
const stylesFilePath = path.join(__dirname, '../testsheets/src/styles.css');
const configPath = path.join(__dirname, 'conf.txt');
const upload = multer({ dest: 'uploads/' });

//���������� � �������������� �������
let config = {};
loadConfig();
//������� ��� ������ � �������������� �������
async function loadConfig() {
    try {
        const data = await fs.promises.readFile(configPath, 'utf8');
        config = parseConfig(data);
    } catch (error) {
        console.error('Error reading config file:', error);
        // Handle the error as needed
    }
}
function parseConfig(data) {
    const lines = data.split('\n');
    const config = {};
    for (const line of lines) {
        const [key, value] = line.split('=');
        if (key && value) {
            config[key.trim()] = value.trim();
        }
    }
    return config;
}
async function saveConfig() {
    const data = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    await fs.promises.writeFile(configPath, data, 'utf-8');
}



//������� ��� ������ � ��������
function readPassword(login) {
    try {
        const encryptedLogin = crypto.createHash('sha256').update(login).digest('hex');
        const passwordPath = path.join(__dirname, `${encryptedLogin}.txt`);

        if (!fs.existsSync(passwordPath)) {
            throw new Error('Password file not found');
        }

        return fs.readFileSync(passwordPath, 'utf8').trim();
    } catch (error) {
        console.error('Error reading password:', error);
        return null;
    }
}
async function isHuman(token) {
    try {
        const secretKey = "6LcPG6EpAAAAAPxxKrdxUIt-AUKMLlcLtZrjVnFj";
        const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`, {
            method: "POST",
        });
        const data = await response.json();

        return data.success;
    } catch (error) {
        console.error('Error checking human:', error);
        return false;
    }
}




//������� ��� ��������� �������� ������
// ������� ��� ����������� MIME-���� �����
function getMimeType(fileName) {
    const extension = fileName.split('.').pop();
    switch (extension.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'mp4':
        case 'avi':
        case 'mkv':
        case 'mov':
            return 'video/mp4';
        case 'txt':
        case 'doc':
        case 'docx':
        case 'pdf':
            return 'text/plain';
        default:
            return 'application/octet-stream';
    }
}
const getFileType = (fileName) => {
    const extension = fileName.split('.').pop();
    switch (extension.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return 'foto';
        case 'mp4':
        case 'avi':
        case 'mkv':
        case 'mov':
            return 'video';
        case 'txt':
        case 'doc':
        case 'docx':
        case 'pdf':
            return 'text';
        default:
            return null; // ����������� ��� �����
    }
};
const getFileUrlType = (data) => {
    const urlPrefixes = ['http://', 'https://'];
    if (urlPrefixes.some(prefix => data.startsWith(prefix))) {
        return 'url';
    } else {
        return 'file';
    }
};



//��������� �������-���������
const convertCamelCaseToDashFormat = (camelCaseString) => {
    return camelCaseString.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};
// ������� ��� ��������� ������ (����� ��� URL)
async function processOrder(orderFilePath, dataToAdd) {
    // ��������� ���������� �� ���� ������. ���� ��� - ������� ��� � ���������� ������ ������
    if (!fs.existsSync(orderFilePath)) {
        await fs.promises.writeFile(orderFilePath, '[]', 'utf-8');
    }

    let orderData = [];

    // ������ ���������� ����� ������
    try {
        const orderFileContent = await fs.promises.readFile(orderFilePath, 'utf-8');
        orderData = JSON.parse(orderFileContent);
    } catch (error) {
        // ������������ ������ ������ ����� ������
        console.error('Error reading order file:', error);
        throw error;
    }

    // ���������� ���������� ������������� ��� ������ �������� ������
    const lastId = orderData.reduce((maxId, item) => {
        const idNumber = parseInt(item.id.replace('index-', ''));
        return idNumber > maxId ? idNumber : maxId;
    }, 0);
    const newDataId = lastId + 1;

    // ��������� ���������� � ����� ����� ��� URL � ������ orderData
    orderData.push({ id: 'index-' + newDataId, data: dataToAdd });

    // ���������� ����������� �������� ���� �� ����
    await fs.promises.writeFile(orderFilePath, JSON.stringify(orderData));
}
function executeCSharpScript(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                reject(error || stderr);
                return;
            }
            resolve(stdout);
        });
    });
}






//������-������
app.post('/login', async (req, res) => { // ������� async ��� ������������� ����������� �������
    const { login, password, recaptchaToken } = req.body;
    const human = await isHuman(recaptchaToken); // ���������� await, ��� ��� isHuman �����������

    if (!human) {
        res.status(400).json({ error: 'Stop posting Amogus, bot.' });
        return;
    }

    try {
        const encryptedLogin = crypto.createHash('sha256').update(login).digest('hex');
        const loginPath = path.join(__dirname, `${encryptedLogin}.txt`);

        console.log('Login path:', loginPath);

        if (!fs.existsSync(loginPath)) {
            throw new Error('Login file not found');
        }

        const savedPassword = readPassword(login); // ���������� ������� readPassword

        const encryptedPassword = crypto.createHash('sha256').update(password).digest('hex');

        if (encryptedPassword === savedPassword) {
            res.json({ login, password: '********' });
        } else {
            res.status(401).json({ error: 'Authentication failed' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/changelogin', (req, res) => {
    const { oldLogin, newLogin, password } = req.body;

    // �������� ������� ������� � ������ ������� � ������ � �������
    if (!oldLogin || !newLogin || !password) {
        return res.status(400).json({ error: 'Old and new logins, and password are required' });
    }

    try {
        // �������� ���� � ����� � ������������� ������ �������
        const encryptedOldLogin = crypto.createHash('sha256').update(oldLogin).digest('hex');
        const oldLoginPath = path.join(__dirname, `${encryptedOldLogin}.txt`);

        // �������� ���� � ����� � ������������� ����� �������
        const encryptedNewLogin = crypto.createHash('sha256').update(newLogin).digest('hex');
        const newLoginPath = path.join(__dirname, `${encryptedNewLogin}.txt`);

        // �������� ������������ ������ �������� �������������� ������
        const currentEncryptedPassword = readPassword(oldLogin);
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        if (currentEncryptedPassword !== passwordHash) {
            console.log('Error updating login: password is incorrect');
            return res.status(401).json({ error: 'Password is incorrect' });
        }

        // ��������, ���������� �� ���� � ����� �������
        if (fs.existsSync(newLoginPath)) {
            console.log('Error updating login: New login already exists');
            return res.status(400).json({ error: 'New login already exists' });
        }

        // �������������� ����� � ������������� ������ ������� � ���� � ������������� ����� �������
        fs.renameSync(oldLoginPath, newLoginPath);

        res.json({ message: `Login updated from ${oldLogin} to ${newLogin}` });
    } catch (error) {
        console.error('Error updating login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// ���������� �������� ��� ���������� � ���������� ������ ������
app.post('/encryptpassword', (req, res) => {
    const { login, password, oldPassword } = req.body;

    // �������� ������� ������, ������� ������� � ������ � �������
    if (!login || !password || !oldPassword) {
        console.log('Error updating: Login, new and old passwords are required');
        return res.status(400).json({ error: 'Login, new and old passwords are required' });
    }

    try {
        // �������� ���� � ����� � ������������� �������
        const encryptedLogin = crypto.createHash('sha256').update(login).digest('hex');
        const passwordPath = path.join(__dirname, `${encryptedLogin}.txt`);

        // ������ �������� �������������� ������ �� ����� � ������������� �������
        const currentEncryptedPassword = fs.readFileSync(passwordPath, 'utf8').trim();

        // �������� ������������ ������� ������ �������� �������������� ������
        const oldEncryptedPassword = crypto.createHash('sha256').update(oldPassword).digest('hex');
        if (oldEncryptedPassword !== currentEncryptedPassword) {
            console.log('Error updating: Old password is incorrect');
            return res.status(401).json({ error: 'Old password is incorrect' });
        }

        // ���������� ������ ������
        const newEncryptedPassword = crypto.createHash('sha256').update(password).digest('hex');

        // ������ �������������� ������ ������ � ���� � ������������� �������
        fs.writeFileSync(passwordPath, newEncryptedPassword, 'utf8');

        res.json({ message: `Encrypted password updated in ${encryptedLogin}.txt` });
    } catch (error) {
        console.error('Error updating encrypted password:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



//������ � �������� ������
// ���������� ����� �����
app.post('/addSourceDir/:folderName', async (req, res) => {
    try {
        const folderNameToAdd = req.params.folderName;
        const folderPath = path.join(config.linksFilePath, folderNameToAdd);

        // ���������, ���������� �� ��� ����� � ����� ������
        const folderExists = await fs.promises.access(folderPath)
            .then(() => true)
            .catch(() => false);

        if (folderExists) {
            return res.status(400).json({ error: 'Folder already exists' });
        }

        // ������� ����� �����
        await fs.promises.mkdir(folderPath);

        // ������� ���� order.json � ����� �����
        const orderFilePath = path.join(folderPath, 'order.json');
        await fs.promises.writeFile(orderFilePath, JSON.stringify([]));

        res.json({ message: 'Folder added successfully' });
    } catch (error) {
        console.error('Error adding folder:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/getAllSourcesDir', async (req, res) => {
    try {
        const folderPath = path.join(config.linksFilePath, config.links);
        // ��������� ������������� ��������� �����
        if (!fs.existsSync(folderPath)) {
            throw new Error('Folder does not exist');
        }

        // ��������� ������������� ����� "order.json"
        const orderFilePath = path.join(folderPath, 'order.json');
        if (!fs.existsSync(orderFilePath)) {
            throw new Error('Order file does not exist');
        }

        // ������ ���������� "order.json"
        const orderFileContent = await fs.promises.readFile(orderFilePath, 'utf-8');
        const orderData = JSON.parse(orderFileContent);

        const files = [];

        // ���������� ������ �� "order.json"
        for (const orderItem of orderData) {
            const filePath = path.join(folderPath, orderItem.data);
            const fileExists = fs.existsSync(filePath);

            let file;
            let fileType;

            if (fileExists) {
                file = orderItem.data;
                fileType = getFileType(orderItem.data);
            } else if (getFileUrlType(orderItem.data) === 'url') {
                file = orderItem.data;
                fileType = 'url';
            } else {
                file = null;
                fileType = 'nonexist';
            }

            const fileData = {
                id: orderItem.id,
                type: fileType,
                file: file
            };

            if (fileData.file != null) files.push(fileData);
        }
        console.log(files);

        // ���������� ������� ����� � ������ �������
        res.json({ files });
    } catch (error) {
        console.error('Error accessing source folders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// ��������� ������ ������ �� ��������� ������������� �����
app.get('/getFilesInFolder/:folderName', async (req, res) => {
    try {
        const folderName = req.params.folderName;
        const folderPath = path.join(config.linksFilePath, folderName);

        // ��������� ������������� ��������� �����
        if (!fs.existsSync(folderPath)) {
            throw new Error('Folder does not exist');
        }

        // ��������� ������������� ����� "order.json"
        const orderFilePath = path.join(folderPath, 'order.json');
        if (!fs.existsSync(orderFilePath)) {
            throw new Error('Order file does not exist');
        }

        // ������ ���������� "order.json"
        const orderFileContent = await fs.promises.readFile(orderFilePath, 'utf-8');
        const orderData = JSON.parse(orderFileContent);

        const files = [];

        // ���������� ������ �� "order.json"
        for (const orderItem of orderData) {
            const filePath = path.join(folderPath, orderItem.data);
            const fileExists = fs.existsSync(filePath);
            const fileType = getFileType(fileExists ? orderItem.data : 'nonexist');
            const fileData = {
                id: orderItem.id,
                type: fileType,
                file: orderItem.data
            };
            files.push(fileData);
        }

        // ���������� ������� ����� � ������ �������
        res.json({ files });
    } catch (error) {
        console.error('Error accessing source folders:', error.message);
        res.status(500).json({ error: error.message });
    }
});
// ��������� ������ ���� ����� (sources)
app.get('/getAllSourceDirs', async (req, res) => {
    try {
        const folders = await fs.promises.readdir(config.linksFilePath);
        res.json({ folders });
    } catch (error) {
        console.error('Error accessing source folders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// ���������� �������� �����
app.put('/renameSourceDir/:oldFolderName', async (req, res) => {
    try {
        const oldFolderName = req.params.oldFolderName;
        const newFolderName = req.body.newFolderName;

        const oldFolderPath = path.join(config.linksFilePath, oldFolderName);
        const newFolderPath = path.join(config.linksFilePath, newFolderName);

        await fs.promises.rename(oldFolderPath, newFolderPath);

        res.json({ message: 'Folder renamed successfully' });
    } catch (error) {
        console.error('Error renaming folder:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// �������� �����
app.delete('/deleteSourceDir/:folderName', async (req, res) => {
    try {
        const folderName = req.params.folderName;
        const folderPath = path.join(config.linksFilePath, folderName);

        await fs.promises.rmdir(folderPath, { recursive: true });

        res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




//������ � �������
// ��������� ����� ������� ����� (source)
app.get('/getSource/:fileName', async (req, res) => {
    const fileName = req.params.fileName;
    const folderPath = path.join(config.linksFilePath, config.links);
    const filePath = path.join(folderPath, fileName);

    try {
        // ������ ���������� ����� ��� �������� ������
        const videoContent = fs.readFileSync(filePath);

        const mimeType = getMimeType(fileName);

        // ������������� ��������������� ��������� Content-Type
        res.setHeader('Content-Type', mimeType); // ������� ���������� MIME-��� ��� ������ �����

        // ���������� ����� ��� �������� ������
        res.send(videoContent);
    } catch (error) {
        console.error('Error accessing source folder:', error);
        res.status(404).json({ error: 'Source file not found' });
    }
});
// ��������� ����� ��������� ����� (source)
app.get('/getSource/:folderName/:fileName', async (req, res) => {
    const folderName = req.params.folderName;
    const fileName = req.params.fileName;
    const folderPath = path.join(config.linksFilePath, folderName);
    const filePath = path.join(folderPath, fileName);

    try {
        // ������ ���������� ����� ��� �������� ������
        const fileContent = fs.readFileSync(filePath);

        // ���������� MIME-��� ����� ��� ���������� �������� ������
        const mimeType = getMimeType(fileName);

        // ������������� ��������������� ��������� Content-Type
        res.setHeader('Content-Type', mimeType);

        // ���������� ���� �������
        res.send(fileContent);
    } catch (error) {
        console.error('Error accessing source folder:', error);
        res.status(404).json({ error: 'Source file not found' });
    }
});
app.post('/addSource/:folderName', upload.single('file'), async (req, res) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(config.linksFilePath, folderName);

    // ���������, ���������� �� �����. ���� ��� - ������� ��.
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true }); // ��� �������� ��������� ����������
    }

    // ���� �������� ����
    if (req.file) {
        const file = req.file; // �������� ���� �� �������
        const fileName = file.originalname;
        const filePath = path.join(folderPath, fileName);

        try {
            // ��������� ���� �� �������
            await fs.promises.rename(file.path, filePath);

            // ��������� ����� ������
            const orderFilePath = path.join(folderPath, 'order.json');
            await processOrder(orderFilePath, fileName);

            res.status(200).send('File uploaded and saved successfully.');
        } catch (error) {
            console.error('Error saving file:', error);
            res.status(500).send('Error uploading file.');
        }
    } else if (req.body.url) { // ���� ������� URL
        const url = req.body.url;
        const orderFilePath = path.join(folderPath, 'order.json');

        try {
            // ��������� ����� ������
            await processOrder(orderFilePath, url);

            res.status(200).send('URL added to order successfully.');
        } catch (error) {
            console.error('Error adding URL to order:', error);
            res.status(500).send('Error adding URL to order.');
        }
    } else {
        res.status(400).send('No file or URL provided.');
    }
});
// �������� ����� �� ��������� ����� (source)
app.delete('/deleteSourceFile/:folderName/:fileName', async (req, res) => {
    try {
        const folderName = req.params.folderName;
        const fileName = req.params.fileName;
        const folderPath = path.join(config.linksFilePath, folderName);
        const filePath = path.join(folderPath, fileName);
        const orderFilePath = path.join(folderPath, 'order.json');

        // ������� ����
        await fs.promises.unlink(filePath);

        // �������� ���������� ����� order.json
        let orderData = [];
        try {
            const orderFileContent = await fs.promises.readFile(orderFilePath, 'utf8');
            orderData = JSON.parse(orderFileContent);
        } catch (error) {
            console.error('Error reading order file:', error);
            // ���� ���� order.json �� ����������, ���������� �������� �����
            return res.json({ message: 'File deleted successfully' });
        }

        // ������� ��������������� ������ �� ������ order.json
        const updatedOrderData = orderData.filter(item => item.data !== fileName);

        console.log(updatedOrderData);

        // ���������� ����������� ������ order.json ������� � ����
        await fs.promises.writeFile(orderFilePath, JSON.stringify(updatedOrderData, null, 2));

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// ���������� ������� ������ � ��������� ����� (source)
app.put('/updateSourceFilesOrder/:folderName', async (req, res) => {
    try {
        const folderName = req.params.folderName;
        const { filesOrder } = req.body;
        const folderPath = path.join(config.linksFilePath, folderName);
        const orderFilePath = path.join(folderPath, 'order.json');

        // ���������� ���������� ������� ������ � ���� order.json
        await fs.promises.writeFile(orderFilePath, JSON.stringify(filesOrder, null, 2));

        res.json({ message: 'Files order updated successfully' });
    } catch (error) {
        console.error('Error updating files order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



//������ �� ��������
app.post('/runCSharpScript', async (req, res) => {
    console.log('Received a POST request to run C# script.');

    const csharpScriptPath = config.csharpScriptPath;
    const credentialsPath = config.credentialsPath;
    const command = `${csharpScriptPath} ${credentialsPath}`;

    try {
        const stdout = await executeCSharpScript(command);
        const data = stdout;
        console.log('C# script executed successfully. Sending data to the client.');
        res.json({ data });
    } catch (error) {
        console.error('Error running C# script:', error.message);
        res.status(500).json({ error: error.message });
    }
});




//������������ �������
app.get('/getConfig', (req, res) => {
    res.json({ config });
});
app.post('/updateConfig', async (req, res) => {
    const updates = req.body;

    if (Array.isArray(updates) && updates.length > 0) {
        try {
            const oldValues = {};  // ��������� ������ �������� � �������

            for (const { key, value } of updates) {
                // ��������� ������ �������� ����� �����������
                oldValues[key] = config[key];
                config[key] = value;
            }

            await saveConfig();
            res.json({ success: true, oldValues });
        } catch (error) {
            console.error('Error updating config:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(400).json({ error: 'Bad Request' });
    }
});
app.post('/updateConfig', async (req, res) => {
    const { key, value } = req.body;
    if (key && value) {
        // Save the old value before updating
        const oldValue = config[key];
        config[key] = value;
        try {
            await saveConfig();
            res.json({ success: true, oldValue });
        } catch (error) {
            console.error('Error updating config:', error);
            // Handle the error as needed
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(400).json({ error: 'Bad Request' });
    }
});




//������������ �������
app.post('/updateStyles', async (req, res) => {
    try {
        const { color, color1, color2, angle, defaultGradient, headerStyles, cellStyles } = req.body;

        const readFileAndUpdateStyles = async (data) => {
            const result = await postcss().process(data, { from: undefined });
            const root = result.root;

            // ������� �������� body
            const bodySelector = root.nodes.find(node => node.selector === 'body');

            // ������� ��� ������� background � background-size
            // ��������� ������� ���� �� ������ �� �������
            if (color || (color1 && color2 && angle) || defaultGradient) {
                // ������� ��� ������� background � background-size
                bodySelector.walkDecls(decl => {
                    if (decl.prop === 'background' || decl.prop === 'background-size') {
                        decl.remove();
                    }
                });

                // ��������� ����� ������� background ����� background-size ��� ����� ����� ������� ����������, ���� background-size �� ���� �������
                if (defaultGradient && defaultGradient !== 'undefined') {
                    bodySelector.insertBefore('background-size', { prop: 'background', value: defaultGradient });
                } else if (color && color !== 'undefined') {
                    bodySelector.insertBefore('background-size', { prop: 'background', value: color });
                } else if (color1 && color2 && angle && color1 !== 'undefined' && color2 !== 'undefined' && angle !== 'undefined') {
                    bodySelector.insertBefore('background-size', { prop: 'background', value: `linear-gradient(${angle}deg, ${color1} 18.72%, ${color2} 84.82%)` });
                }

                // ��������� ����� ������� background-size, ���� ��� �� ���� �������
                if (!bodySelector.some(node => node.prop === 'background-size')) {
                    bodySelector.append({ prop: 'background-size', value: '100vw 100vh' });
                }
            }


            // ��������� ������� ������ ���������� � ��������� ����� ��� ��������� ������������
            if (headerStyles) {
                let headerSelector = root.nodes.find(node => node.selector === '.fl-table th');
                if (headerSelector) {
                    // ������� ��� ������������ ����� ����������
                    headerSelector.removeAll();
                } else {
                    // ���� ����� ��� ���������� �����������, ������� ����� ��������
                    headerSelector = postcss.rule({ selector: '.fl-table th' });
                    root.append(headerSelector);
                }

                // ��������� ����� ��� ��������� ������������ ����� ��� ����������
                const defaultHeaderStyles = {
                    fontSize: headerStyles.fontSize || '16px',
                    fontFamily: headerStyles.fontFamily || 'Arial, sans-serif',
                    fontWeight: headerStyles.fontWeight || 'normal',
                    color: headerStyles.color || '#fff'
                };

                for (const property in defaultHeaderStyles) {
                    headerSelector.append({ prop: convertCamelCaseToDashFormat(property), value: defaultHeaderStyles[property] });
                }
            }

            // ��������� ������� ������ ��� ����� � ��������� ����� ��� ��������� ������������
            if (cellStyles) {
                let cellSelector = root.nodes.find(node => node.selector === '.fl-table td');
                if (cellSelector) {
                    // ������� ��� ������������ ����� �����
                    cellSelector.removeAll();
                } else {
                    // ���� ����� ��� ����� �����������, ������� ����� ��������
                    cellSelector = postcss.rule({ selector: '.fl-table td' });
                    root.append(cellSelector);
                }

                // ��������� ����� ��� ��������� ������������ ����� ��� �����
                const defaultCellStyles = {
                    fontSize: cellStyles.fontSize || '14px',
                    fontFamily: cellStyles.fontFamily || 'Arial, sans-serif',
                    fontWeight: cellStyles.fontWeight || 'normal',
                    color: cellStyles.color || '#fff'
                };

                for (const property in defaultCellStyles) {
                    cellSelector.append({ prop: convertCamelCaseToDashFormat(property), value: defaultCellStyles[property] });
                }
            }

            return root.toString();
        };

        // ������ ������� ���� styles.css
        fs.readFile(stylesFilePath, 'utf8', async (err, data) => {
            if (err) {
                console.error('Error reading styles file:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            try {
                const updatedData = await readFileAndUpdateStyles(data);

                // ���������� ����������� ����� ������� � ����
                fs.writeFile(stylesFilePath, updatedData, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing updated styles to file:', err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }
                    console.log('Styles have been updated and saved to file.');
                    res.json({ success: true });
                });
            } catch (error) {
                console.error('Error updating styles:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    } catch (error) {
        console.error('Error updating styles:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




//������������ �������
app.get('/getCSharpScriptConfig', async (req, res) => {
    try {
        const csharpScriptPath = config.csharpScriptPath;
        const command = `${csharpScriptPath} -command getconfig`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error running C# script:', error.message);
                res.status(500).json({ error: `Error running C# script: ${error.message}` });
                return;
            }

            if (stderr) {
                console.error('C# script returned an error:', stderr);
                res.status(500).json({ error: `C# script returned an error: ${stderr}` });
                return;
            }

            try {
                const jsonData = JSON.parse(stdout);
                console.log('C# script executed successfully. Sending parsed JSON data to the client.');
                res.json(jsonData);
            } catch (jsonError) {
                console.error('Error parsing JSON data:', jsonError);
                res.status(500).json({ error: 'Error parsing JSON data from C# script' });
            }
        });
    } catch (error) {
        console.error('Error fetching C# Script configuration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/updateCSharpScriptConfig', async (req, res) => {
    const updates = req.body;

    if (Array.isArray(updates) && updates.length > 0) {
        try {
            const csharpScriptPath = config.csharpScriptPath;
            const configPath = path.join(csharpScriptPath, '..', 'config.json');

            // ��������� ������� ������������ �� �����
            let currentConfig = {};
            try {
                const configData = await fs.promises.readFile(configPath);
                currentConfig = JSON.parse(configData);
            } catch (error) {
                console.error(`Error reading config file: ${error.message}`);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            const updatedConfigs = [];

            // ������������ ������ ���������� � �������
            for (const update of updates) {
                const { key, value } = update;
                console.log('Key:', key);
                console.log('Value:', value);

                if (key && value) {
                    // ��������� ������ �������� ����� �����������
                    const oldValue = currentConfig[key];
                    currentConfig[key] = value;
                    updatedConfigs.push({ success: true, oldValue });
                } else {
                    updatedConfigs.push({ success: false, error: 'Bad Request (key, value)' });
                }
            }

            // ��������� ����������� ������������ � ����
            try {
                const jsonConfig = JSON.stringify(currentConfig, null, 2);
                await fs.promises.writeFile(configPath, jsonConfig);
                console.log('Config saved successfully.');
            } catch (error) {
                console.error(`Error saving config file: ${error.message}`);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // �������� ������ ����������� ����������
            const updatedParams = updatedConfigs.map(config => config.oldValue);

            // ���������� ����� � ����������� �� ����������� ����������
            res.json({ updatedParams, updatedConfigs });
        } catch (error) {
            console.error('Error updating config:', error);
            // ������������ ������ �� �������������
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.status(400).json({ error: 'Bad Request (Array)' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
