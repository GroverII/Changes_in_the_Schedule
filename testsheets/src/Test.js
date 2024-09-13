import React, { Component } from "react";
import { url, getFilesInThisFolder, getAllFileFolders, renameFolder, addSourceFolder, deleteSourceFolder } from './adminToServer.js';

class Test extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sourcesList: [],
            currentFolder: 'links', // Изначально выбираем папку 'links'
            folders: [],
            newFolderName: '',
            selectedFileContent: ''
        };
    }

    async componentDidMount() {
        await this.loadData();
    }

    async loadData() {
        try {
            const sourcesList = await getFilesInThisFolder(this.state.currentFolder);
            const folders = await getAllFileFolders();
            this.setState({
                sourcesList: sourcesList,
                folders: folders
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    handleFolderClick = async (folderName) => {
        try {
            const sourcesList = await getFilesInThisFolder(folderName);
            this.setState({
                sourcesList: sourcesList,
                currentFolder: folderName
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    handleRenameFolder = async () => {
        const { currentFolder, newFolderName } = this.state;
        try {
            await renameFolder(currentFolder, newFolderName);
            await this.loadData(); // Перезагрузить данные после переименования папки
            this.setState({ newFolderName: '' }); // Очистить поле нового названия папки
        } catch (error) {
            console.error('Error renaming folder:', error);
        }
    }

    handleAddFolder = async () => {
        const { newFolderName } = this.state;
        try {
            await addSourceFolder(newFolderName);
            await this.loadData(); // Перезагрузить данные после добавления папки
            this.setState({ newFolderName: '' }); // Очистить поле нового названия папки
        } catch (error) {
            console.error('Error adding folder:', error);
        }
    }

    handleDeleteFolder = async (folderName) => {
        try {
            await deleteSourceFolder(folderName);
            await this.loadData(); // Перезагрузить данные после удаления папки
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    }

    handleInputChange = (event) => {
        this.setState({ newFolderName: event.target.value });
    }

    handleFileClick = async (fileName) => {
        const { currentFolder } = this.state;
        try {
            const response = await fetch(`${url}getSource/${currentFolder}/${fileName}`);
            if (!response.ok) {
                throw new Error('Failed to fetch file content');
            }

            const blob = await response.blob(); // Получаем содержимое файла в виде Blob
            const imageUrl = URL.createObjectURL(blob); // Создаем URL для Blob

            // Отображаем изображение, если оно загружено успешно
            this.setState({ selectedFileContent: <img src={imageUrl} alt={fileName} /> });
        } catch (error) {
            console.error('Error fetching file content:', error);
        }
    }


    render() {
        const { sourcesList, folders, newFolderName, selectedFileContent } = this.state;
        return (
            <div>
                <h2>Sources List:</h2>
                <ul>
                    {sourcesList && sourcesList.files && sourcesList.files.map((item, index) => (
                        <li key={index} onClick={() => this.handleFileClick(item.file)}>
                            {item.file} - {item.type}
                        </li>
                    ))}
                </ul>
                <h3>Current Folder: {this.state.currentFolder}</h3>
                <h4>All Folders:</h4>
                <ul>
                    {folders && folders.map((folder, index) => (
                        <li key={index}>
                            <button onClick={() => this.handleFolderClick(folder)}>{folder}</button>
                            <button onClick={() => this.handleDeleteFolder(folder)}>Delete</button>
                        </li>
                    ))}
                </ul>
                <div>
                    <h4>Rename Current Folder:</h4>
                    <input type="text" value={newFolderName} onChange={this.handleInputChange} />
                    <button onClick={this.handleRenameFolder}>Rename</button>
                </div>
                <div>
                    <h4>Add New Folder:</h4>
                    <input type="text" value={newFolderName} onChange={this.handleInputChange} />
                    <button onClick={this.handleAddFolder}>Add</button>
                </div>
                <div>
                    <h4>Selected File Content:</h4>
                    <pre>{selectedFileContent}</pre>
                </div>
            </div>
        );
    }
}

export default Test;
