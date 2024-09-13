import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { getFileType } from './adminToServer.js';
import AdminConsole from './AdminConsole';
import Test from './Test';
import ReactPlayer from 'react-player';
import DataTable from './Data_table';
import './styles.css';
import './App.css';

function App() {
    const [sourceList, setSourceList] = useState([]);
    const [currentTime, setCurrentTime] = useState("");
    const [currentDateLV, setCurrentDateLV] = useState("");
    const [currentDate, setCurrentDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [timeZone, setTimeZone] = useState("");
    const [spreadsheetData, setSpreadsheetData] = useState([]);
    const [itemsPerPage] = useState(20);
    const url = 'http://localhost:3001/';
    const [renderedContent, setRenderedContent] = useState(null);
    const [renderedButtons, setRenderedButtons] = useState(null);
    const [cache, setCache] = useState({});
    const [videoTimes, setVideoTimes] = useState({});
    const totalPages = Math.ceil(spreadsheetData.length / itemsPerPage);
    const interval = 500000;

    const getFormattedTime = useCallback(() => {
        if (timeZone) {
            const currentDate = new Date(new Date().toLocaleString('en-US', { timeZone: timeZone }));
            const hours = currentDate.getHours().toString().padStart(2, '0');
            const minutes = currentDate.getMinutes().toString().padStart(2, '0');
            const seconds = currentDate.getSeconds().toString().padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }
        return "";
    }, [timeZone]);

    const getFormattedDate = useCallback(() => {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1; // Note: January is 0
        const year = date.getFullYear();

        return `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}.${year}.`;
    }, []);

    const getFormattedSpecificDate = useCallback(() => {
        if (timeZone) {
            const currentDate = new Date();
            const options = {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            };
            const formattedDate = currentDate.toLocaleDateString('lv-LV', options); // 'lv-LV' - код локали для латышского языка
            return formattedDate;
        }
        return "";
    }, [timeZone]);


    useEffect(() => {
        const fetchTimeZone = async () => {
            try {
                // Получение конфигурации из сервера
                const response = await fetch(url + 'getConfig');
                if (!response.ok) {
                    throw new Error('Failed to fetch configuration');
                }
                const data = await response.json();
                const { config } = data;
                const { TimeZone } = config; // Извлекаем только TimeZone из объекта config
                setTimeZone(TimeZone); // Устанавливаем значение временной зоны
            } catch (error) {
                console.error('Error fetching configuration:', error);
            }
        };

        // Выполняем запрос на сервер для получения TimeZone при монтировании компонента
        fetchTimeZone();

        // Устанавливаем интервал для выполнения запроса TimeZone каждые 30 секунд
        const intervalId = setInterval(fetchTimeZone, 30 * 1000);

        // Очищаем интервал при размонтировании компонента
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        // Устанавливаем интервал для обновления остальных данных каждую секунду
        const intervalId = setInterval(() => {
            setCurrentTime(getFormattedTime());
            setCurrentDate(getFormattedDate());
            setCurrentDateLV(getFormattedSpecificDate());
        }, 1000);

        // Очищаем интервал при размонтировании компонента
        return () => clearInterval(intervalId);
    }, [getFormattedTime, getFormattedDate, getFormattedSpecificDate]);

    

    useEffect(() => {
        const intervalId = setInterval(() => {
            const totalElements = totalPages + sourceList.length;
            const nextPage = currentPage + 1 > totalElements ? 1 : currentPage + 1;
            setCurrentPage(nextPage);
        }, interval); // Вызывать каждые interval/1000 секунд

        return () => clearInterval(intervalId);
    }, [currentPage, totalPages, sourceList]);

    const handleVideoProgress = (file, progress) => {
        setVideoTimes(prevTimes => ({
            ...prevTimes,
            [file]: progress.playedSeconds
        }));
    };


    const renderContent = useCallback(async () => {
        const sortData = (data, columns) => {
            const sortedData = [...data];

            sortedData.sort((a, b) => {
                for (let i = 0; i < columns.length; i++) {
                    const column = columns[i];
                    const valueA = a[column] || '';
                    const valueB = b[column] || '';

                    if (column === 'class') {
                        const regex = /^(\d+)([^\d]+)(?: \(([^)]+)\))?$/;
                        const matchA = valueA.match(regex);
                        const matchB = valueB.match(regex);

                        if (matchA && matchB) {
                            const numComparison = parseInt(matchA[1], 10) - parseInt(matchB[1], 10);

                            if (numComparison !== 0) {
                                return numComparison;
                            }

                            const romanComparison = romanToNumber(matchA[3]) - romanToNumber(matchB[3]);

                            if (romanComparison !== 0) {
                                return romanComparison;
                            }

                            return matchA[2].localeCompare(matchB[2], 'en', { sensitivity: 'base' });
                        } else {
                            return 0;
                        }
                    } else {
                        const comparison = valueA.localeCompare(valueB, 'en', { sensitivity: 'base' });

                        if (comparison !== 0) {
                            return comparison;
                        }
                    }
                }
                return 0;
            });

            return sortedData;
        };

        const sortedFilteredData = sortData(spreadsheetData, ['subst_person', 'lesson', 'class', 'lesson_room', 'graduated_teacher', 'notes']);
        if (currentPage > totalPages) {
            const sourceIndex = currentPage - totalPages - 1;
            const source = sourceList[sourceIndex];
            
            if (!source) { 
                console.log(`No source`);
                return null;
            }

            const request = url + "getSource/" + source.file;

            if (source.type === "url") {
                const urlType = getFileType(source.file);

                switch (urlType) {
                    case 'foto':
                        return (
                            <img
                                src={source.file}
                                alt={`Page ${currentPage}`}
                                className="photoImage"
                            />
                        );
                    case 'video':
                    case'youtube':
                        if (videoTimes[source.file] == null) {
                            videoTimes[source.file] = 0;
                        }
                        console.log(videoTimes);
                        return (
                            <ReactPlayer
                                url={source.file}
                                width="100vw"
                                height="100vh"
                                playing
                                controls
                                muted
                                onProgress={(progress) => handleVideoProgress(source.file, progress)}
                                config={{
                                    youtube: {
                                        playerVars: {
                                            start: videoTimes[source.file]
                                        }
                                    }
                                }}
                            />
                        );
                    case 'text':
                        const txtFileRequest = await fetch(source.file);

                        if (txtFileRequest.ok) {
                            const txtContent = await txtFileRequest.text();

                            return (
                                <h1>{txtContent}</h1>
                            );
                        } else {
                            // Обработка ошибки получения файла .txt
                            console.error('Error fetching .txt file:', txtFileRequest.status);
                            return <div>Error fetching URL(text)</div>;
                        }
                    default:
                        console.error(`Unsupported URL type: ${urlType}`);
                        return (<div>Unsupported URL type</div>);
                }
            }
            else{
                switch (source.type) {
                    // В вашем компоненте с отображением контента
                    case "text":
                        try {
                            if (cache[source.file] == null) {
                                const response = await fetch(request);
                                console.log('HTTP status:', response.status, cache);
                                if (response.ok) {
                                    const textContent = await response.text();

                                    setCache(prevCache => ({
                                        ...prevCache,
                                        [source.file]: textContent
                                    }));
                                } else {
                                    // Обработка ошибок
                                    console.error('Error fetching text:', response.status);
                                    return <div>Error fetching text</div>;
                                }
                            }
                            return <pre>{cache[source.file]}</pre>;
                        } catch (error) {
                            console.error('Error fetching text:', error);
                            return <div>Error fetching text</div>;
                        }

                    case "foto":
                        try {
                            if (cache[source.file] == null) {
                                const response = await fetch(request);
                                console.log('HTTP status:', response.status, cache);
                                if (response.ok) {
                                    if (source.type.startsWith("foto")) {
                                        const blobData = await response.blob();
                                        const imageUrl = URL.createObjectURL(blobData);

                                        setCache(prevCache => ({
                                            ...prevCache,
                                            [source.file]: imageUrl
                                        }));
                                    } else {
                                        // Добавьте обработку других типов файлов, если необходимо
                                        return (<div>Error fetching image</div>);
                                    }
                                } else {
                                    // обработка ошибок
                                    console.error('Error fetching image:', response.status);
                                    return (<div>Error fetching image</div>);
                                }
                            }
                            return (
                                <img
                                    src={cache[source.file]}
                                    alt={`Sheet ${currentPage}`}
                                    className="photoImage"
                                />
                            );
                        } catch (error) {
                            console.error('Error fetching image:', error);
                            return (<div>Error fetching image</div>);
                        }
                    case "video":
                        try {
                            if (cache[source.file] == null) {
                                const response = await fetch(request);
                                console.log('HTTP status:', response.status, cache);
                                if (response.ok) {
                                    const videoBlob = await response.blob();
                                    const videoUrl = URL.createObjectURL(videoBlob);

                                    setCache(prevCache => ({
                                        ...prevCache,
                                        [source.file]: videoUrl
                                    }));
                                } else {
                                    // Обработка ошибок
                                    console.error('Error fetching video:', response.status);
                                    return <div>Error fetching video</div>;
                                }
                            }
                                return (
                                    <div className="videoContainer">
                                        {cache[source.file] != null ? (
                                            <video className="videoPlayer" autoPlay loop muted>
                                                <source src={cache[source.file]} type="video/mp4" />
                                                <source src={cache[source.file]} type="video/ogg" />
                                                Your browser does not support the video tag.
                                            </video>
                                        ) : (
                                            <div>No data</div>
                                        )}
                                    </div>
                                );
                        } catch (error) {
                            console.error('Error fetching video:', error);
                            return <div>Error fetching video</div>;
                        }
                    default:
                        console.error(`Unsupported type: ${source.type}`);
                        return (<div>Error fetching video</div>);
                }
            }
        } else {
            console.log('Table data');
            // код для отображения таблицы данных
            return (
                <div>
                    <h1>{currentTime}</h1>
                    <h2>AIZVIETOŠANAS LAPA</h2>
                    <h3>{currentDateLV}</h3>
                    <div className="table-wrapper">
                        <table className="fl-table">
                            <thead>
                                <tr>
                                    <th>Aizvietotājs</th>
                                    <th>Stunda</th>
                                    <th>Klase</th>
                                    <th>Kab.</th>
                                    <th>Promešosais skolotājs</th>
                                    <th>Piezīmes</th>
                                </tr>
                            </thead>
                            <tbody className="dataBody">
                                {sortedFilteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((data, index) => (
                                    <DataTable
                                        key={index}
                                        data={data}
                                        currentDate={currentDate}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
    }, [cache, currentDate, currentDateLV, currentPage, currentTime, itemsPerPage, sourceList, spreadsheetData, totalPages, videoTimes]);

    const renderPageNumbersAsync = useCallback(async () => {
        const paginate = (pageNumber) => {
            setCurrentPage(pageNumber);
            if (pageNumber > totalPages)
                console.log(`Clicked on photo page ${pageNumber}`);
        };

        const renderPageNumbers = async () => {
            const pageNumbers = [];
            let totalElements = sourceList.length;

            for (let i = 1; i <= totalPages + totalElements; i++) {
                pageNumbers.push(
                    <PageButton
                        key={i}
                        onClick={() => paginate(i)}
                        isActive={i === currentPage}
                    />
                );
            }

            return pageNumbers;
        };
        const pageNumbers = await renderPageNumbers();
        setRenderedButtons(pageNumbers); // Оборачиваем массив элементов в фрагмент для корректного отображения
    }, [currentPage, sourceList.length, totalPages]);

    useEffect(() => {
        const renderAsyncContent = async () => {
            const content = await renderContent();
            setRenderedContent(content);
        };

        if (window.location.pathname !== "/admin") {
            console.log(`Rendering...`);
            renderAsyncContent();
            renderPageNumbersAsync();
        } else {
            const styleLink = document.createElement("link");
            styleLink.rel = "stylesheet";
            styleLink.href = "./style_adm.css"; // Замените на путь к вашему файлу стилей
            document.head.appendChild(styleLink);

            // Добавляем идентификатор для body
            document.body.id = "admin-body";
        }

        
    }, [currentPage, sourceList, spreadsheetData, currentTime, renderPageNumbersAsync, renderContent]);


    useEffect(() => {
        const fetchSourcesList = async () => {
            try {
                const response = await fetch(url + 'getAllSourcesDir');
                if (!response.ok) {
                    console.error('Failed to fetch sources list. HTTP status:', response.status);
                    throw new Error('Failed to fetch sources list');
                }
                const { files } = await response.json();
                console.log('files - ', files);
                setSourceList(files);
            } catch (error) {
                console.error('Error fetching sources list:', error);
            }
        };

        // Запускаем функцию для получения списка источников данных
        fetchSourcesList();
    }, []);

    const PageButton = ({ onClick, isActive }) => (
        <button onClick={onClick} className={`button-81 ${isActive ? 'active' : ''}`}>
        </button>
    );

    const romanToNumber = (roman) => {
        const romanNumeralMap = {
            I: 1,
            II: 2,
            III: 3
        };

        return romanNumeralMap[roman] || 0;
    };

    useEffect(() => {
        const runCSharpScript = async () => {
            try {
                console.log('Sending a POST request to run C# script...');

                const response = await fetch(url + 'runCSharpScript', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                console.log('Server response received:', response);

                if (!response.ok) {
                    console.error('Failed to run C# script on the server. HTTP status:', response.status);
                    throw new Error('Failed to run C# script on the server');
                }

                const JsonData = await response.text(); // Get the raw text response

                const jsonData = JSON.parse(JsonData); // Parse the cleaned JSON string

                let dataArray = JSON.parse(jsonData.data);

                console.log('Server response data received:', dataArray);

                // Заполняем пропуски в свойстве "date"
                for (let i = 0; i < dataArray.length; i++) {
                    if (dataArray[i].date === null || dataArray[i].date === "") {
                        dataArray[i].date = dataArray[i - 1].date;
                    }
                }

                // Удаляем элементы, у которых все свойства (кроме "date") пусты
                dataArray = dataArray.filter(item => {
                    if (item.subst_person === "" || item.subst_person === "nav stundas")
                        return false; // Все свойства (кроме "date") пусты, удаляем элемент
                    return true;
                });

                const filteredData = filterDataByCurrentDate(dataArray);

                console.log('C# script executed successfully. Data from the server:', filteredData);
                setSpreadsheetData(filteredData);
            } catch (error) {
                console.error('Error running C# script:', error);
            }
        };

        const filterDataByCurrentDate = (data) => {
            return data.filter(item => {
                const itemDate = item.date;
                console.log(itemDate + " - " + currentDate)
                return itemDate === currentDate;
            });
        };


        // Вызываем функцию для отправки POST-запроса
        runCSharpScript();

    }, [currentDate, setSpreadsheetData]);

    return (
        <div>
            <Routes>
                <Route path="/" element={
                    <div style={{ overflow: "hidden" }}>
                        {renderedContent}
                        {/*
                        <input
                            type="number"
                            id="itemsPerPage"
                            onChange={handleItemsPerPageChange}
                            placeholder="Items per page..."
                            min="1"
                            className="itemsPerPageInput"
                        />
                        */}
                        <div className="paginationContainer">
                            {renderedButtons}
                        </div>
                    </div>
                } />
                {/* Добавляем маршрут к AdminConsole */}
                <Route path="/admin" element={<AdminConsole />} />
                <Route path="/test" element={<Test />} />
                {/* Другие маршруты, если необходимо */}
            </Routes>
        </div>
    );

}

export default App;
