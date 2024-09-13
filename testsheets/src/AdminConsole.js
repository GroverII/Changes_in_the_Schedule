import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ReCAPTCHA from "react-google-recaptcha";
import moment from 'moment-timezone';
import { ReactAnglePicker } from 'react-angle-picker';
import './style_adm.css';
import {
    url, getFilesInThisFolder, renameFolder, getFileDisplay, isValidURL,
    getFileTypeFromURL, updateConfig, getAllFileFolders, addSourceFolder,
    deleteSourceFolder, deleteSource, authenticate, changeLogin,
    runCSharpScript, updateStyles, applyTableStylesAsync
} from './adminToServer.js';
import * as XLSX from 'xlsx';

const AdminConsole = () => {
    const [login, setLogin] = useState('');
    const [oldLogin, setOldLogin] = useState('');
    const [newLogin, setNewLogin] = useState('');

    const [password, setPassword] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [loginInfo,setLoginInfo] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [activeTab, setActiveTab] = useState('aizvietosanas');
    const [selectedOption, setSelectedOption] = useState('Vienlaidu');

    const [color, setColor] = useState('#ff0000');
    const [color1, setColor1] = useState('#ff0000');
    const [color2, setColor2] = useState('#00ff00');
    const [angle, setAngle] = React.useState(1);

    const [tableColor, setTableColor] = useState('');
    const [backgroundType, setBackgroundType] = useState('');

    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('');

    const [sourcesList, setSourcesList] = useState([]);
    const [selectedTimeZone, setSelectedTimeZone] = useState('Europe/Riga'); // Установите часовой пояс по умолчанию
    const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
    const [credentialFile, setCredentialFile] = useState(null);
    const [columnNamesRange, setColumnNamesRange] = useState('');
    const [dataRange, setDataRange] = useState('');
    const [tableName, setTableName] = useState('');
    const units = ['px', '%', 'vw', 'vh'];
    const [headerStyles, setHeaderStyles] = useState({
        fontSize: 'px',
        fontFamily: '',
        fontWeight: '',
        fontStyle: '',
        textTransform: '',
        color: ''
    });
    const [cellStyles, setCellStyles] = useState({
        fontSize: 'px',
        fontFamily: '',
        fontWeight: '',
        fontStyle: '',
        textTransform: '',
        color: ''
    });
    const fontFamilies = [
        'Arial',
        'Verdana',
        'Tahoma',
        'Times New Roman',
        'Georgia',
        'Courier New',
        // Добавьте другие варианты семейств шрифтов по желанию
    ];
    const reRef = useRef();
    const timeZones = moment.tz.names();
    const key = "6LcPG6EpAAAAADbUuzfmtz2P_oTIvj6ydJ6F6zms";

    const handleTableNameChange = (name) => {
        setTableName(name);
    }

    const isValidGoogleSheetsUrl = (url) => {
        // Пример простой проверки URL на наличие ключевых слов
        return url.includes('docs.google.com/spreadsheets');
    };

    const isValidJsonFile = (file) => {
        // Проверка, что файл имеет расширение .json
        return file && file.name.endsWith('.json');
    };

    const isValidRange = (range) => {
        const regex = /^[A-Z]+[1-9]\d*:?[A-Z]+\d*$/;
        if (!regex.test(range)) {
            return false;
        }

        // Получаем начальную и конечную буквы диапазона
        const [start, end] = range.split(':').map(cell => cell.replace(/\d/g, ''));

        // Проверяем количество столбцов в диапазоне
        const startColumn = getColumnNumber(start);
        const endColumn = getColumnNumber(end);
        const columnCount = Math.abs(endColumn - startColumn) + 1; // Подсчитываем количество столбцов

        return columnCount <= 8;
    };

    const getColumnNumber = (column) => {
        // Преобразуем буквенное обозначение столбца в число (например, A -> 1, B -> 2 и т.д.)
        let result = 0;
        for (let i = 0; i < column.length; i++) {
            result *= 26;
            result += column.charCodeAt(i) - 64; // Получаем номер буквы (от 1 до 26)
        }
        return result;
    };

    const extractSpreadsheetId = (url) => {
        // Проверяем, что URL содержит часть '/spreadsheets/d/'
        const startIndex = url.indexOf('/spreadsheets/d/');
        if (startIndex !== -1) {
            // Извлекаем часть URL после '/spreadsheets/d/'
            const substring = url.substring(startIndex + '/spreadsheets/d/'.length);
            // Ищем следующий символ '/', который разделяет SpreadsheetId от остальной части URL
            const endIndex = substring.indexOf('/');
            if (endIndex !== -1) {
                // Возвращаем подстроку до следующего '/'
                return substring.substring(0, endIndex);
            }
        }
        // Если не удалось найти SpreadsheetId в URL, возвращаем null
        return null;
    };

    const handleSubmit = async () => {
        if (!isValidGoogleSheetsUrl(spreadsheetUrl)) {
            alert('Ievadiet derīgu Google Sheets URL');
            return;
        }

        if (!isValidJsonFile(credentialFile)) {
            alert('Lejupielādējiet credentials.json failu');
            return;
        }

        if (!isValidRange(columnNamesRange)) {
            alert('Ievadiet derīgu kolonnu nosaukumu diapazonu');
            return;
        }

        if (!isValidRange(dataRange)) {
            alert('Ievadiet derīgu datu diapazonu');
            return;
        }

        if (tableName === '') {
            alert('Tabulas nosaukums nepieciešams');
            return;
        }

        try {
            // Отправляем данные на сервер с использованием fetch
            const response = await fetch(url + 'updateCSharpScriptConfig', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([
                    {
                        key: 'SpreadsheetId',
                        value: extractSpreadsheetId(spreadsheetUrl)
                    },
                    {
                        key: 'SheetName',
                        value: tableName
                    },
                    {
                        key: 'ColumnsRange',
                        value: columnNamesRange
                    },
                    {
                        key: 'DataRange',
                        value: dataRange
                    }
                ])
            });
            // Проверяем успешность запроса
            if (response.ok) {
                const responseData = await response.json();
                // Обработка ответа сервера, если необходимо
                console.log(responseData);
            } else {
                // Обработка ошибки
                const errorData = await response.json().catch(() => null);
                if (errorData && errorData.error) {
                    console.error('Ошибка:', errorData.error);
                }
                alert('Произошла ошибка при отправке данных на сервер');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при отправке данных на сервер');
        }
    };

    const handleTableColorChangeDebounced = useCallback(debounce((newColor) => {
        setHeaderStyles({ ...headerStyles, color: newColor });
        setCellStyles({ ...cellStyles, color: newColor });
        setTableColor(newColor);
    }, 300), [headerStyles, cellStyles]);

    const handleAddURL = async () => {
        let urlInput = prompt('Enter URL:');
        if (urlInput) {
            // Проверяем, является ли введенное значение ссылкой
            if (isValidURL(urlInput)) {
                // Проверяем, является ли ссылка видео или фото
                const fileType = await getFileTypeFromURL(urlInput);
                const formData = new FormData();
                formData.append('url', urlInput); // Добавляем URL в FormData
                // Если тип файла определен, делаем запрос на сервер
                if (fileType) {
                    try {
                        const response = await fetch(`${url}addSource/${encodeURIComponent(selectedFolder)}`, {
                            method: 'POST',
                            body: formData
                        });
                        if (response.ok) {
                            alert('File added successfully');
                        } else {
                            alert('Failed to add file');
                        }
                    } catch (error) {
                        alert('Error adding file:', error);
                    }
                } else {
                    alert('Unsupported file type');
                }
            } else {
                alert('Invalid URL');
            }
        } else {
            alert('URL is empty');
        }
    };


    const handleFileInputChange = async (event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${url}addSource/${selectedFolder}`, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                alert('File uploaded successfully');
            } else {
                alert('Failed to upload file');
            }
        } catch (error) {
            alert('Error uploading file:', error);
        }
    };

    const handleDataRangeChange = (range) => {
        setDataRange(range);
    };

    const handleColumnRangeChange = (range) => {
        setColumnNamesRange(range);
    };

    const handleTimeZoneChange = async (e) => {
        setSelectedTimeZone(e.target.value);
        const updates = [
            { key: 'TimeZone', value: e.target.value }
        ];

        try {
            await updateConfig(updates);
        } catch (error) {
            alert('Error updating config:', error);
        }
    };


    useEffect(() => {
        getAllFolders();
    }, []);
    const getAllFolders = async () => {
        try {
            const data = await getAllFileFolders();
            setFolders(data);
        } catch (error) {
            alert('Error getting folders:', error);
        }
    };
    const handleAddFolder = async () => {
        let folderName = prompt('Enter folder name:');
        if (folderName) {

            try {
                await addSourceFolder(folderName);
                getAllFolders();
            } catch (error) {
                alert('Error adding folder:', error);
            }
        }
    };
    const handleFolderClick = async (folderName) => {
        setSelectedFolder(folderName);
        try {
            const data = await getFilesInThisFolder(folderName);
            const sourcesList = data;
            setSourcesList(sourcesList);
        } catch (error) {
            alert('Error getting sources list:', error);
        }
    };
    const handleRenameFolder = async (folderName) => {
        let newFolderName = prompt("Ievadiet jaunu mapes nosaukumu:", folderName);

        if (newFolderName !== null) {
            try {
                const data = await renameFolder(folderName, newFolderName); // Используем функцию для отправки запроса к серверу
                alert(data.message);
                getAllFolders();
            } catch (error) {
                console.error('Kļūda, mainot mapes nosaukumu:', error);
                alert('Radās kļūda, mainot mapes nosaukumu');
            }
        }
    };
    const handleDeleteFolder = async (folderName) => {
        if (window.confirm('Are you sure you want to delete this folder?')) {
            try {
                await deleteSourceFolder(folderName);
                getAllFolders();
            } catch (error) {
                alert('Error deleting folder:', error);
            }
        }
    };


    const handleDeleteLink = async (type, fileName) => {
        try {
            const success = await deleteSource(selectedFolder, fileName);
            if (success) {
                alert('File deleted successfully');
                // Здесь можно добавить дополнительные действия после успешного удаления файла, если необходимо
                setSourcesList(prevList => Array.isArray(prevList) ? prevList.filter(item => !(item.type === type && item.fileName === fileName)) : prevList);
            } else {
                alert('Error deleting file: Failed to delete file');
                // Обработка ошибок удаления файла
            }
        } catch (error) {
            alert('Error deleting file:', error);
            // Обработка ошибок сетевого запроса
        }
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleLogin = async () => {
        try {
            // Получаем токен ReCAPTCHA
            const token = await reRef.current.executeAsync();
            reRef.current.reset();

            // Аутентификация
            const response = await authenticate(login, password, token);

            // Обрабатываем ответ сервера
            if (response.ok) {
                setIsLoggedIn(true);
            } else {
                // Обработка ошибки входа
                console.error('Login failed');
                setLoginInfo(response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
            setLoginInfo(error);
        }
    };

    const handleLoginChange = async () => {
        if (oldLogin === '' || newLogin === '' || password === '') {
            alert('Old login, new login, and new password are required.');
            return;
        }

        try {
            const { success, error } = await changeLogin(oldLogin, newLogin, password);
            if (success) {
                alert('Login updated successfully.');
            } else {
                alert(error);
            }
        } catch (error) {
            console.error('Error updating login:', error);
            alert('Network error. Failed to update login.');
        }
    };

    const handleOptionChange = (option) => {
        setSelectedOption(option);
    };

    const handleColorChangeDebounced = debounce((newColor) => {
        setColor(newColor);
    }, 300);

    // Вспомогательная функция debounce
    function debounce(func, timeout) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), timeout);
        };
    }

    // Обработчик изменения цвета
    const handleColorChange = (e) => {
        const newColor = e.target.value;
        handleColorChangeDebounced(newColor);
    };

    const handleChange = (value) => {
        setAngle(value);
    };

    const handleColorChange1Debounced = debounce((newColor) => {
        setColor1(newColor);
    }, 300);

    // Обработчик изменения цвета 2 с задержкой
    const handleColorChange2Debounced = debounce((newColor) => {
        setColor2(newColor);
    }, 300);

    // Обработчик изменения цвета 1
    const handleColorChange1 = (e) => {
        const newColor = e.target.value;
        handleColorChange1Debounced(newColor);
    };

    // Обработчик изменения цвета 2
    const handleColorChange2 = (e) => {
        const newColor = e.target.value;
        handleColorChange2Debounced(newColor);
    };

    const applySingleColor = async () => {
        const bodyData = { color };
        try {
            await updateStyles(bodyData);
            alert('Styles updated succesfully!');
            // Дополнительная обработка данных, если необходимо
        } catch (error) {
            alert('Error applying single color:', error);
        }
    };

    const applyGradient = async () => {
        const bodyData = { color1, color2, angle };
        try {
            await updateStyles(bodyData);
            alert('Styles updated succesfully!');
            // Дополнительная обработка данных, если необходимо
        } catch (error) {
            alert('Error applying gradient:', error);
        }
    };

    const resetToDefaultGradient = async () => {
        const defaultGradient = 'linear-gradient(229.82deg, #FFC400 18.72%, #FF6B00 84.82%)';
        const bodyData = { defaultGradient };
        try {
            await updateStyles(bodyData);
            alert('Styles updated succesfully!');
            // Дополнительная обработка данных, если необходимо
        } catch (error) {
            alert('Error resetting to default gradient:', error);
        }
    };

    const applyTableStyles = async () => {
        try {
            await applyTableStylesAsync(headerStyles, cellStyles);
            alert('Styles updated succesfully!');
        } catch (error) {
            alert('Error applying table styles:', error);
        }
    };

    const handleFontSizeChange = (value, type, isHeader) => {
        if (isHeader) {
            if (type === 'number') {
                setHeaderStyles(prevStyles => ({
                    ...prevStyles,
                    fontSize: `${value}${headerStyles.fontSize.replace(/\d+/g, '')}`
                }));
            } else if (type === 'unit') {
                setHeaderStyles(prevStyles => ({
                    ...prevStyles,
                    fontSize: `${headerStyles.fontSize.replace(/\D/g, '')}${value}`
                }));
            }
        } else {
            if (type === 'number') {
                setCellStyles(prevStyles => ({
                    ...prevStyles,
                    fontSize: `${value}${cellStyles.fontSize.replace(/\d+/g, '')}`
                }));
            } else if (type === 'unit') {
                setCellStyles(prevStyles => ({
                    ...prevStyles,
                    fontSize: `${cellStyles.fontSize.replace(/\D/g, '')}${value}`
                }));
            }
        }
    };


    const resetStyles = async () => {
        // Устанавливаем стандартные стили
        setHeaderStyles({ // Здесь установите стандартные значения для headerStyles
            ...headerStyles,
            fontSize: '16px', // Просто заменяем значение fontSize на стандартное
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 'normal',
            // Другие стили
        });
        setCellStyles({ // Здесь установите стандартные значения для cellStyles
            ...cellStyles,
            fontSize: '14px', // Просто заменяем значение fontSize на стандартное
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 'normal',
            // Другие стили
        });
        try {
            await applyTableStylesAsync(headerStyles, cellStyles);
            alert('Styles updated succesfully!');
        } catch (error) {
            alert('Error applying table styles:', error);
        }
    };


    const handlePasswordChange = async () => {
        // Проверка на совпадение нового пароля и его подтверждения
        if (newPassword !== confirmNewPassword) {
            alert('New password and confirm password must match');
            return;
        }

        try {
            const response = await fetch(url + 'encryptpassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    login: login,
                    password: newPassword,
                    oldPassword: oldPassword
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update password');
            }

            // Очистка полей после успешного обновления пароля
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');

            // Дополнительные действия после успешного обновления пароля, например, показать сообщение об успехе
            alert('Password updated successfully');
        } catch (error) {
            console.error('Error updating password:', error.message);
            // Действия в случае ошибки, например, показать сообщение об ошибке
            alert('Failed to update password. Please try again later.');
        }
    };

    const sortedTimeZones = timeZones.sort((a, b) => {
        const offsetA = moment.tz(a).utcOffset();
        const offsetB = moment.tz(b).utcOffset();
        return offsetA - offsetB;
    });

    const handleSpreadsheetUrlChange = (url) => {
        setSpreadsheetUrl(url);

        // Проверка валидности URL Google Sheets
        if (isValidGoogleSheetsUrl(url)) {
            // URL валиден для Google Sheets - выполнить нужные действия
            console.log('Valid Google Sheets URL');
        } else {
            // URL не является URL Google Sheets - выполнить нужные действия, например, вывод сообщения об ошибке
            console.log('Invalid Google Sheets URL');
        }
    };

    const handleCredentialFileChange = (file) => {
        setCredentialFile(file);

        // Чтение содержимого файла
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileContent = event.target.result;

            // Проверка валидности содержимого файла credentials.json
            if (isValidCredentialsFile(fileContent)) {
                // Файл credentials.json валиден - выполнить нужные действия
                console.log('Valid credentials.json file');
            } else {
                // Файл credentials.json невалиден - выполнить нужные действия, например, вывод сообщения об ошибке
                console.log('Invalid credentials.json file');
            }
        };
        reader.readAsText(file);
    };

    const isValidCredentialsFile = (fileContent) => {
        // Преобразование содержимого файла в объект
        let credentials;
        try {
            credentials = JSON.parse(fileContent);
        } catch (error) {
            console.error("Error parsing credentials.json:", error);
            return false;
        }

        // Проверка наличия обязательных полей
        const requiredFields = [
            "type",
            "project_id",
            "private_key_id",
            "private_key",
            "client_email",
            "client_id",
            "auth_uri",
            "token_uri",
            "auth_provider_x509_cert_url",
            "client_x509_cert_url"
        ];

        for (const field of requiredFields) {
            if (!credentials.hasOwnProperty(field)) {
                alert(`Missing required field in credentials.json: ${field}`);
                return false;
            }
        }

        // Проверка типа
        if (credentials.type !== "service_account") {
            alert(`Invalid type in credentials.json: ${credentials.type}`);
            return false;
        }

        // Проверка формата приватного ключа
        const privateKeyFormatRegex = /^-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----\n$/;
        if (!privateKeyFormatRegex.test(credentials.private_key)) {
            alert("Invalid format for private key in credentials.json");
            return false;
        }

        // Дополнительные проверки, если необходимо

        // Если все обязательные поля присутствуют и прошли проверку,
        // считаем файл учетных данных валидным
        return true;
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) {
            return;
        }

        const sourceId = result.source.droppableId;
        const destinationId = result.destination.droppableId;

        // Если перемещение происходит внутри sourcesList
        if (sourceId === 'droppable' && destinationId === 'droppable') {
            const items = Array.from(sourcesList.files);
            // Проверяем, существует ли элемент для перемещения
            if (result.source.index < items.length) {
                const [reorderedItem] = items.splice(result.source.index, 1);
                items.splice(result.destination.index, 0, reorderedItem);
                const orderData = [];

                // Перебираем items и формируем orderData
                for (let i = 0; i < items.length; i++) {
                    orderData.push({ id: items[i].id, data: items[i].file });
                }

                try {
                    const response = await fetch(`${url}updateSourceFilesOrder/${encodeURIComponent(selectedFolder)}`, {
                        method: 'PUT', // Используем метод PUT
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ filesOrder: orderData }) // Передаем поле filesOrder
                    });

                    if (response.ok) {
                        // Обновляем состояние sourcesList.files
                        setSourcesList({ files: items });
                    } else {
                        alert('Failed to update order:', response.statusText);
                    }
                } catch (error) {
                    alert('Error updating order:', error);
                }
            }
        }
    };
    return (
        <div>
            {!isLoggedIn && (
                <div className="admin-form">
                    <div>
                        <label htmlFor="login">Lietotājvārds:</label>
                        <input
                            type="text"
                            id="login"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password">Parole:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <ReCAPTCHA
                        sitekey={key}
                        size="invisible"
                        ref={reRef}
                    />
                    <div>
                        <label>{loginInfo}</label>
                    </div>
                    <button onClick={handleLogin}>Ienākt</button>

                </div>
            )}
            {isLoggedIn && (
                <div>
                    <div className="tab-container">
                        <button
                            onClick={() => handleTabClick('aizvietosanas')}
                            className={activeTab === 'aizvietosanas' ? 'active-tab' : ''}
                        >
                            Aizvietošanas
                        </button>

                        <button
                            onClick={() => handleTabClick('atteli')}
                            className={activeTab === 'atteli' ? 'active-tab' : ''}
                        >
                            Attēli
                        </button>

                        <button
                            onClick={() => handleTabClick('iestatijumi')}
                            className={activeTab === 'iestatijumi' ? 'active-tab' : ''}
                        >
                            Iestatījumi
                        </button>
                    </div>
                    {/* Отображение контента в зависимости от выбранного таба */}
                    {activeTab === 'aizvietosanas' && (
                        <div className="content-container">
                            {/* Вставьте содержимое компонента AizvietosanasTab */}
                            <button
                                className={selectedOption === 'Vienlaidu' ? 'active-tab' : ''}
                                onClick={() => handleOptionChange('Vienlaidu')}
                            >
                                Vienlaidu
                            </button>
                            <button
                                className={selectedOption === 'Gradients' ? 'active-tab' : ''}
                                onClick={() => handleOptionChange('Gradients')}
                            >
                                Gradients
                            </button>
                            <button
                                className={selectedOption === 'tabula' ? 'active-tab' : ''}
                                onClick={() => handleOptionChange('tabula')}
                            >
                                Tabula
                            </button>
                            <button
                                className={selectedOption === 'additional' ? 'active-tab' : ''}
                                onClick={() => handleOptionChange('additional')}
                            >
                                Papildus
                            </button>
                            {selectedOption === 'additional' && (
                                <div className="table-settings-container">
                                    <label htmlFor="spreadsheetUrl">Google Sheets URL:</label>
                                    <input
                                        type="text"
                                        id="spreadsheetUrl"
                                        placeholder="Enter Google Sheets URL"
                                        value={spreadsheetUrl}
                                        onChange={(e) => handleSpreadsheetUrlChange(e.target.value)}
                                    />
                                    {/* Вывод зеленой галочки, если ссылка валидна */}
                                    <br />
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => handleCredentialFileChange(e.target.files[0])}
                                    />

                                    {/* Возможность загрузить файл credentials.json */}
                                    <br />
                                    <label htmlFor="tableName">Table Name:</label> 
                                    <input
                                        type="text"
                                        id="tableName"
                                        placeholder="Enter table name"
                                        value={tableName}  
                                        onChange={(e) => handleTableNameChange(e.target.value)} 
                                    />
                                    <br />
                                    <label htmlFor="columnNamesRange">Stabiņu nosaukumu diapazons:</label>
                                    <input
                                        type="text"
                                        id="columnNamesRange"
                                        placeholder="Enter column names range (e.g., B2:I2)"
                                        value={columnNamesRange}
                                        onChange={(e) => handleColumnRangeChange(e.target.value)}
                                    />
                                    {/* Вывод зеленой галочки, если диапазон названий столбцов валиден */}
                                    <br />
                                    <label htmlFor="dataRange">Datu diapazons:</label>
                                    <input
                                        type="text"
                                        id="dataRange"
                                        placeholder="Enter data range (e.g., B3:I)"
                                        value={dataRange}
                                        onChange={(e) => handleDataRangeChange(e.target.value)}
                                    />
                                    {/* Кнопка для сохранения на сервере */}
                                    <button className="apply-button" onClick={handleSubmit}>Saglabāt</button>
                                </div>
                            )}
                            {selectedOption === 'tabula' && (
                                <div className="table-settings-container">
                                    {/* Элементы для настройки стилей таблицы */}
                                    <div className="settings-group">
                                        <h4>Galvenes stili:</h4>
                                        <div className="setting">
                                            <label htmlFor="headerFontSize">Fonta izmērs:</label>
                                            <input
                                                type="number"
                                                id="headerFontSize"
                                                placeholder="Ievadi fonta izmēru galvenes stiliem"
                                                value={headerStyles.fontSize.replace(/\D/g, '')} // Значение числа
                                                onChange={(e) => handleFontSizeChange(e.target.value, 'number', true)}
                                                step="any"
                                            />
                                            <select
                                                value={headerStyles.fontSize.replace(/\d+/g, '')} // Значение типа единицы
                                                onChange={(e) => handleFontSizeChange(e.target.value, 'unit', true)}
                                            >
                                                {units.map(unit => (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="setting">
                                            <label htmlFor="headerFontFamily">Fonta ģimene:</label>
                                            <select
                                                id="headerFontFamily"
                                                value={headerStyles.fontFamily}
                                                onChange={(e) => setHeaderStyles({ ...headerStyles, fontFamily: e.target.value })}
                                            >
                                                <option value="">Izvēlies fonta ģimeni</option>
                                                {fontFamilies.map((font, index) => (
                                                    <option key={index} value={font}>{font}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="setting">
                                            <label htmlFor="headerFontWeight">Fonta svars:</label>
                                            <select
                                                id="headerFontWeight"
                                                value={headerStyles.fontWeight}
                                                onChange={(e) => setHeaderStyles({ ...headerStyles, fontWeight: e.target.value })}
                                            >
                                                <option value="">Izvēlies fonta svaru</option>
                                                <option value="normal">Normāls</option>
                                                <option value="bold">Trekns</option>
                                                {/* Pievieno citas fonta svara opcijas šeit */}
                                            </select>
                                        </div>
                                        {/* Добавьте другие параметры стилей для шапки таблицы здесь */}
                                    </div>
                                    <div className="settings-group">
                                        <h4>Galvenes stili:</h4>
                                        <div className="setting">
                                            <label htmlFor="cellFontSize">Fonta izmērs:</label>
                                            <input
                                                type="number"
                                                id="cellFontSize"
                                                placeholder="Ievadi fonta izmēru tabulas šūnām"
                                                value={cellStyles.fontSize.replace(/\D/g, '')} // Значение числа
                                                onChange={(e) => handleFontSizeChange(e.target.value, 'number', false)}
                                                step="any"
                                            />
                                            <select
                                                value={cellStyles.fontSize.replace(/\d+/g, '')} // Значение типа единицы
                                                onChange={(e) => handleFontSizeChange(e.target.value, 'unit', false)}
                                            >
                                                {units.map(unit => (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="setting">
                                            <label htmlFor="cellFontFamily">Fonta ģimene:</label>
                                            <select
                                                id="cellFontFamily"
                                                value={cellStyles.fontFamily}
                                                onChange={(e) => setCellStyles({ ...cellStyles, fontFamily: e.target.value })}
                                            >
                                                <option value="">Izvēlies fonta ģimeni</option>
                                                {fontFamilies.map((font, index) => (
                                                    <option key={index} value={font}>{font}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="setting">
                                            <label htmlFor="cellFontWeight">Fonta svars:</label>
                                            <select
                                                id="cellFontWeight"
                                                value={cellStyles.fontWeight}
                                                onChange={(e) => setCellStyles({ ...cellStyles, fontWeight: e.target.value })}
                                            >
                                                <option value="">Izvēlies fonta svaru</option>
                                                <option value="normal">Normāls</option>
                                                <option value="bold">Trekns</option>
                                                {/* Pievieno citas fonta svara opcijas šeit */}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="settings-group">
                                        <h4>Tabulas krāsa:</h4>
                                        <input
                                            type="color"
                                            id="tableColor"
                                            value={tableColor}
                                            onChange={(e) => {
                                                const newColor = e.target.value;
                                                handleTableColorChangeDebounced(newColor);
                                            }}
                                        />
                                    </div>
                                    <button className="apply-button" onClick={applyTableStyles}>Pielietot tabulas stilus</button>
                                    <button className="apply-button" onClick={resetStyles}>Atiestatīt noklusētos stilus</button>
                                </div>
                            )}
                            {selectedOption === 'Vienlaidu' && (
                                <div className="table-settings-container">
                                    {/* Элементы для Vienlaidu */}
                                    <input
                                        className="custom-style"
                                        type="color"
                                        value={color}
                                        onChange={handleColorChange}
                                    />
                                    <input
                                        type="text"
                                        className="custom-color-input"
                                        value={color}
                                        onChange={handleColorChange}
                                    />
                                    <button className="apply-button" onClick={applySingleColor}>Pielietot vienu krāsu</button>
                                    <button className="apply-button" onClick={resetToDefaultGradient}>Atiestatīt uz noklusējumu</button>
                                    <br />
                                </div>
                            )}

                            {selectedOption === 'Gradients' && (
                                <div className="table-settings-container">
                                    {/* Элементы для Gradients */}
                                    <input
                                        className="custom-style"
                                        type="color"
                                        value={color1}
                                        onChange={handleColorChange1}
                                    />
                                    <input
                                        type="text"
                                        className="custom-color-input"
                                        value={color1}
                                        onChange={handleColorChange1}
                                    />
                                    <input
                                        className="custom-style"
                                        type="color"
                                        value={color2}
                                        onChange={handleColorChange2}
                                    />
                                    <input
                                        type="text"
                                        className="custom-color-input"
                                        value={color2}
                                        onChange={handleColorChange2}
                                    />
                                    <br />
                                    <div>Gradient Angle:</div>
                                    <ReactAnglePicker
                                        angle={angle}
                                        onChange={handleChange}
                                        onFinalChange={handleChange} // Для мгновенного изменения угла
                                    />
                                    {angle}<br /><br />
                                    <button className="apply-button" onClick={applyGradient}>Pielietot gradientu</button>
                                    <button className="apply-button" onClick={resetToDefaultGradient}>Atiestatīt uz noklusējumu</button>
                                    <br />
                                </div>
                            )}

                            <div className="table-wrapper" style={{
                                top: '0vh', left: '15vw', transform: 'translate(0, 0) scale(0.6)', color: tableColor, background: backgroundType === 'gradient' ?
                                    `linear-gradient(${angle}deg, ${color1}, ${color2})` :
                                    backgroundType === 'color' ?
                                        color :
                                        'none'
                            }}>
                                <table className="fl-table">
                                    <thead>
                                        <tr style={{ border: "3px solid " + tableColor }}>
                                            <th style={{ border: "3px solid " + tableColor, fontFamily: headerStyles.fontFamily, fontWeight: headerStyles.fontWeight, fontStyle: headerStyles.fontStyle, textTransform: headerStyles.textTransform, color: headerStyles.color }}>Aizvietotājs</th>
                                            <th style={{ border: "3px solid " + tableColor, fontFamily: headerStyles.fontFamily, fontWeight: headerStyles.fontWeight, fontStyle: headerStyles.fontStyle, textTransform: headerStyles.textTransform, color: headerStyles.color }}>Stunda</th>
                                            <th style={{ border: "3px solid " + tableColor, fontFamily: headerStyles.fontFamily, fontWeight: headerStyles.fontWeight, fontStyle: headerStyles.fontStyle, textTransform: headerStyles.textTransform, color: headerStyles.color }}>Klase</th>
                                            <th style={{ border: "3px solid " + tableColor, fontFamily: headerStyles.fontFamily, fontWeight: headerStyles.fontWeight, fontStyle: headerStyles.fontStyle, textTransform: headerStyles.textTransform, color: headerStyles.color }}>Kab.</th>
                                            <th style={{ border: "3px solid " + tableColor, fontFamily: headerStyles.fontFamily, fontWeight: headerStyles.fontWeight, fontStyle: headerStyles.fontStyle, textTransform: headerStyles.textTransform, color: headerStyles.color }}>Promešosais skolotājs</th>
                                            <th style={{ border: "3px solid " + tableColor, fontFamily: headerStyles.fontFamily, fontWeight: headerStyles.fontWeight, fontStyle: headerStyles.fontStyle, textTransform: headerStyles.textTransform, color: headerStyles.color }}>Piezīmes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>John Doe</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>1.</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>11A</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>101</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>Jane Smith</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>No special notes</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>Jane Smith</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>3.</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>10B</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>102</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>John Doe</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>No special notes</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>Michael Johnson</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>5.</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>12C</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>103</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>Mary Wilson</td>
                                            <td style={{ border: "3px solid " + tableColor, fontFamily: cellStyles.fontFamily, fontWeight: cellStyles.fontWeight, fontStyle: cellStyles.fontStyle, textTransform: cellStyles.textTransform, color: cellStyles.color }}>Bring extra materials</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="button-wrapper">
                                    <label htmlFor="backgroundType">Fona veids:</label>
                                    <select
                                        id="backgroundType"
                                        value={backgroundType}
                                        onChange={(e) => setBackgroundType(e.target.value)}
                                        className="custom-select"
                                    >
                                        <option value="none">None</option>
                                        <option value="color">Color</option>
                                        <option value="gradient">Gradient</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    <DragDropContext onDragEnd={handleDragEnd}>
                        {activeTab === 'atteli' && (
                            <div className="content-container">
                                <div className="folder-container">
                                    <button onClick={handleAddFolder}>Pievienot mapi</button>
                                    {folders && folders.map((folder, index) => (
                                        <div key={folder} className="folder-item">
                                            <button onClick={() => handleFolderClick(folder)}>{folder}</button>
                                            <button onClick={() => handleRenameFolder(folder)}>Mainīt nosaukumu</button>
                                            <span
                                                onClick={() => handleDeleteFolder(folder)}
                                                className="delete-icon">
                                                ✖
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="previewWindow">
                                    <div className="file-upload-container">
                                        <label htmlFor="fileInput">Izvēlieties failu, ko pievienot:</label>
                                        <input type="file" id="fileInput" accept="image/*, video/*, .txt" onChange={handleFileInputChange} />
                                        <button onClick={handleAddURL}>Pievienot URL</button>
                                    </div>
                                    <div className="container">
                                        <div style={{ border: '2px solid rgba(245, 245, 245, 1)', borderRadius: '2vw' }}>
                                            {sourcesList && sourcesList.length > 0 &&
                                                <h4>Mapes "{selectedFolder}" faili:</h4>
                                            }
                                            {/* Оборачиваем список пользовательских файлов в компонент Droppable */}
                                            <Droppable droppableId="droppable">
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                                        {sourcesList && sourcesList.files && sourcesList.files.map((source, index) => (
                                                            <Draggable key={source.id} draggableId={source.id} index={index}>
                                                                {(provided) => (
                                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="previewItem">
                                                                        {/* Объединяем все элементы в одну строку */}
                                                                        <span>{index + 1}. </span>
                                                                        <span style={{ display: 'inline-block' }}>
                                                                            {getFileDisplay(selectedFolder, source)}
                                                                        </span>
                                                                        <span>{source.file}</span>
                                                                        <div className="flex-container">
                                                                            {/* Иконка */}
                                                                            <span style={{ cursor: 'pointer' }} onClick={() => handleDeleteLink(source.type, source.file)}>✖</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DragDropContext>
                    {activeTab === 'iestatijumi' && (
                        <div className="content-container">
                            {/* Содержимое компонента IestatijumiTab */}
                            <div className="label-container">
                                <label htmlFor="timeZoneSelect">Izvēlieties laika joslu:</label>
                                <select id="timeZoneSelect" value={selectedTimeZone} onChange={handleTimeZoneChange} className="select-container">
                                    {sortedTimeZones.map(timeZone => {
                                        const offsetMinutes = moment.tz(timeZone).utcOffset();
                                        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
                                        const offsetMinutesPart = Math.abs(offsetMinutes) % 60;
                                        const offsetString = (offsetMinutes >= 0 ? '+' : '-') + offsetHours.toString().padStart(2, '0') + ':' + offsetMinutesPart.toString().padStart(2, '0');
                                        const [region, city] = timeZone.split("/").map(part => part.replace("_", " "));
                                        return (
                                            <option key={timeZone} value={timeZone}>
                                                (UTC {offsetString}) {region}, {city}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="input-container">
                                {/* Поля ввода для обновления пароля */}
                                <input
                                    type="password"
                                    placeholder="Vecais parole"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                                <input
                                    type="password"
                                    placeholder="Jaunā parole"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <input
                                    type="password"
                                    placeholder="Apstipriniet jauno paroli"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                />
                                <br></br>
                                <button onClick={handlePasswordChange} className="button-container">Atjaunot paroli</button>
                            </div>

                            <div className="input-container">
                                {/* Поля ввода для обновления логина */}
                                <input
                                    type="text"
                                    placeholder="Vecais lietotājvārds"
                                    value={oldLogin}
                                    onChange={(e) => setOldLogin(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Jaunais lietotājvārds"
                                    value={newLogin}
                                    onChange={(e) => setNewLogin(e.target.value)}
                                />
                                <br></br>
                                <button onClick={handleLoginChange} className="button-container">Atjaunot lietotājvārdu</button>
                            </div>
                        </div>

                    )}

                </div>
            )}
        </div>
    );
};

export default AdminConsole;
