// adminToServer.js
import { useDrag } from 'react-dnd';
import ReactPlayer from 'react-player';

export const url = 'http://localhost:3001/'; // Замените на ваш URL сервера, если нужно

// Функция для определения типа файла на основе его расширения
export const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
        return 'foto';
    } else if (['mp4', 'avi', 'mkv', 'mov'].includes(extension)) {
        return 'video';
    } else if (['txt', 'doc', 'docx', 'pdf'].includes(extension)) {
        return 'text';
    } else if (/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|mp4|avi|mkv|mov))/.test(fileName)) {
        // Если ссылка на изображение или видео
        if (/\.(png|jpg|jpeg|gif)$/.test(fileName)) {
            return 'foto';
        } else if (/\.(mp4|avi|mkv|mov)$/.test(fileName)) {
            return 'video';
        }
    } else if (/youtu\.?be/.test(fileName)) {
        return 'youtube';
    }
    return null; // Неизвестный тип файла
};


export const getSourcesList = async (folderName) => {
    try {
        const response = await fetch(url + `getAllSourcesDir/${folderName}`);
        return await response.json();
    } catch (error) {
        console.error('Error getting sources list:', error);
        throw error;
    }
};
export const getAllFileFolders = async () => {
    try {
        const response = await fetch(url + 'getAllSourceDirs');
        const data = await response.json();
        return data.folders || []; // Извлекаем массив папок из объекта, если он существует, иначе возвращаем пустой массив
    } catch (error) {
        console.error('Error getting folders:', error);
        throw error;
    }
};
export const getFilesInThisFolder = async (folderName) => {
    try {
        const response = await fetch(`${url}getFilesInFolder/${encodeURIComponent(folderName)}`);
        return await response.json();
    } catch (error) {
        console.error('Error getting files in folder:', error);
        throw error;
    }
};
export const renameFolder = async (folderName, newFolderName) => {
    return await fetch(`${url}renameSourceDir/${encodeURIComponent(folderName)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newFolderName: newFolderName })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Kļūda, mainot mapes nosaukumu');
            }
            return response.json();
        });
};
export const addSourceFolder = async (folderName) => {
    try {
        const response = await fetch(url + 'addSourceDir/' + folderName, {
            method: 'POST'
        });
        return await response.json();
    } catch (error) {
        console.error('Error adding folder:', error);
        throw error;
    }
};
export const deleteSourceFolder = async (fileName) => {
    try {
        const response = await fetch(url + `deleteSourceDir/${fileName}`, {
            method: 'DELETE',
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting folder:', error);
        throw error;
    }
};

export const getFileDisplay = (dir, file) => {
    const fileType = getFileType(file.file);

    // Если это URL-адрес на YouTube
    if (fileType === 'youtube') {
        return (
            <ReactPlayer
                url={file.file}
                width="10vw"
                height="7.4vh"
                playing
                controls
                muted
            />
        );
    } else if (fileType === 'foto') {
        return (
            <a href={`${url}getSource/${dir}/${file.file}`} target="_blank" rel="noopener noreferrer">
                <img src={`${url}getSource/${dir}/${file.file}`} alt={`Image ${file.index}`} className="previewImage" />
            </a>
        );
    } else if (fileType === 'video') {
        return (
            <a href={`${url}getSource/${dir}/${file.file}`} target="_blank" rel="noopener noreferrer">
                <ReactPlayer
                    url={`${url}getSource/${dir}/${file.file}`}
                    width="10vw"
                    height="7.4vh"
                    playing
                    controls
                    muted
                />
            </a>
        );
    } else if (fileType === 'text') {
        return (
            <a href={`${url}getSource/${dir}/${file.file}`} target="_blank" rel="noopener noreferrer" className="previewItemLink">
                {file.file}
            </a>
        );
    } else {
        return (
            <div>{file.file}</div>
        );
    }
};



export function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

export const getFileTypeFromURL = async (url) => {
    try {
        // Проверяем, является ли URL ссылкой на YouTube
        if (url.includes('youtu.be') || url.includes('youtube.com')) {
            return 'URL(video)';
        } else {
            // Если URL не является ссылкой на YouTube, проверяем тип контента
            const response = await fetch(`${url}proxy?url=${encodeURIComponent(url)}`);
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('image')) {
                return 'URL(foto)';
            } else if (contentType && contentType.includes('video')) {
                return 'URL(video)';
            }
        }
    } catch (error) {
        console.error('Error fetching URL:', error);
    }

    return null; // Если тип файла не определен или возникла ошибка
};


export const updateConfig = async (updates) => {
    try {
        const response = await fetch(url + 'updateConfig', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating config:', error);
        throw error;
    }
};



export const deleteSource = async (selectedFolder, fileName) => {
    try {
        const encodedFileName = encodeURIComponent(fileName);

        const response = await fetch(url + `deleteSourceFile/${selectedFolder}/${encodedFileName}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};



export function DraggableItem({ index, type, handleDrag, children }) {
    const [{ isDragging }, drag] = useDrag({
        item: { type, index },
        collect: monitor => ({
            isDragging: monitor.isDragging(),
        }),
    });

    drag(handleDrag(index, type));

    return (
        <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
            {children}
        </div>
    );
}


export const authenticate = async (login, password, recaptchaToken) => {
    try {
        // Отправляем данные на сервер для аутентификации
        const response = await fetch(url + 'login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: login,
                password: password,
                recaptchaToken: recaptchaToken
            }),
        });

        // Возвращаем результат аутентификации
        return response;
    } catch (error) {
        // Если произошла ошибка, возвращаем ее
        throw error;
    }
};

export const changeLogin = async (oldLogin, newLogin, password) => {
    try {
        const response = await fetch(url + 'changelogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ oldLogin, newLogin, password }),
        });

        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: 'Failed to update login' };
        }
    } catch (error) {
        return { success: false, error: 'Network error. Failed to update login' };
    }
};

export const runCSharpScript = async () => {
    try {
        const response = await fetch(url + 'runCSharpScript', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to run C# script on the server. HTTP status: ${response.status}`);
        }

        const jsonData = await response.json();

        if (!jsonData.data.trim()) {
            console.error('Empty response data received from the server.');
            return;
        }

        let dataArray;

        try {
            dataArray = JSON.parse(jsonData.data);
        } catch (parseError) {
            throw new Error(`Error parsing JSON data: ${parseError}`);
        }

        if (!Array.isArray(dataArray)) {
            throw new Error(`Data is not an array: ${dataArray}`);
        }

        return dataArray;
    } catch (error) {
        throw new Error(`Error during C# script execution: ${error}`);
    }
};

export const getConfig = async () => {
    try {
        const response = await fetch(url + 'getConfig');
        if (!response.ok) {
            throw new Error(`Failed to fetch configuration. HTTP status: ${response.status}`);
        }
        const data = await response.json();
        return data.config;
    } catch (error) {
        throw new Error(`Error fetching configuration: ${error}`);
    }
};

export const getCSharpScriptConfigAsnc = async () => {
    try {
        const response = await fetch(url + 'getCSharpScriptConfig');
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`Error fetching C# Script configuration: ${error}`);
    }
};

export const updateStyles = async (bodyData) => {
    try {
        const response = await fetch(url + 'updateStyles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating styles:', error);
    }
};

export const applyTableStylesAsync = async (headerStyles, cellStyles) => {
    try {
        const headerStylesToSend = {
            fontSize: headerStyles.fontSize,
            fontFamily: headerStyles.fontFamily,
            fontWeight: headerStyles.fontWeight,
            color: headerStyles.color // Добавьте цвет для заголовка, если это необходимо
            // Другие свойства, если есть
        };
        const cellStylesToSend = {
            fontSize: cellStyles.fontSize,
            fontFamily: cellStyles.fontFamily,
            fontWeight: cellStyles.fontWeight,
            color: cellStyles.color // Добавьте цвет для ячеек, если это необходимо
            // Другие свойства, если есть
        };
        const response = await fetch(url + 'updateStyles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ headerStyles: headerStylesToSend, cellStyles: cellStylesToSend })
        });
        const data = await response.json();
        return data; // Возвращаем данные для обработки на стороне клиента
    } catch (error) {
        console.error('Error applying table styles:', error);
        throw error; // Перехватываем ошибку и пробрасываем её дальше
    }
};
