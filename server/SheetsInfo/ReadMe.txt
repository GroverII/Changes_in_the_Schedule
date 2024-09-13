Основные файлы тут -
\server\SheetsInfo\SheetsInfo\bin\Debug\net8.0

winged-ratio-412809-2e31b7f6d8e7.json - файл, где находится секретный ключ для работы с Google.Apis(spreadsheets). Не меняется через админменю.

config.json - файл, где храняться основные конфигурации для работы с spreadsheets:
{
  "ConfigPath": ".\\config.json",
  "SpreadsheetId": "1MBboSLNI-avCAJ7RZPeJKL-JPIuFY4H9eBoq3W18Qao",
  "SheetName": "firstTest",
  "ColumnsRange": "B2:I2",
  "DataRange": "B3:I",
  "Command": null
}
   ConfigPath и Command - остаточный код. При желании можно удалить, однако нужно убрать также их упоминание в коде. Не меняется.
   SpreadsheetId - айди для spreadsheets. К примеру у такой ссылки -
        https://docs.google.com/spreadsheets/d/1keBZnXyBXml952ghFyibz5g2MHMUwCO30IoptiPQE7Y/edit#gid=1745464392
           айди будет 
        1keBZnXyBXml952ghFyibz5g2MHMUwCO30IoptiPQE7Y
   SheetName - название таблицы, из которой брать данные.
   ColumnsRange - рендж названий колонок. Формат - 4 колонны с данными, 1 пропуск, 3 колонны с данными.
   DataRange - рендж данных. Можно прописывать как частично(B3:I) так и полностью(B3:I33). Однако неполностью более гибко, так как берёт все данные , а не до какой-то строки.

Для того, чтобы изменения вступили в силу нужно зайти в файл SheetsInfo.sln, находящийся в данной папке(\server\SheetsInfo) и в правом верхнем углу нажать правой кнопкой мыши по SheetsInfo.cs(иконка - C# в прямоугольнике). Потом нажать на 2 вариант сверху(Rebuild).

Если нужны ресурсы для понимания как работать с spreadsheets API -
   общая инфомация -
https://developers.google.com/apis-explorer?hl=ru

   Создание API ключей -
https://console.cloud.google.com/apis/dashboard