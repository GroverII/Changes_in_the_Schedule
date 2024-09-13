using Google.Apis.Auth.OAuth2;
using Google.Apis.Sheets.v4;
using Google.Apis.Sheets.v4.Data;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;

namespace SheetsInfo
{
    class SheetsInfo
    {
        private static Config config;


        public class Config
        {
            public string ConfigPath { get; set; } = ".\\config.json";
            public string SpreadsheetId { get; set; }
            public string SheetName { get; set; }
            public string ColumnsRange { get; set; }
            public string DataRange { get; set; }
            public string Command { get; set; }
        }
        public class SheetData
        {
            [JsonProperty("date")]
            public string? Date { get; set; }

            [JsonProperty("subst_person")]
            public string? SubstPerson { get; set; }

            [JsonProperty("lesson")]
            public string Lesson { get; set; } = "";

            [JsonProperty("class")]
            public string Class { get; set; } = "";

            [JsonProperty("lesson_room")]
            public string LessonRoom { get; set; } = "";

            [JsonProperty("graduated_teacher")]
            public string? GraduatedTeacher { get; set; }

            [JsonProperty("notes")]
            public string? Notes { get; set; }
        }

        static void Main(string[] args)
        {
            config = new Config();
            LoadConfig();

            MainAsync(args).GetAwaiter().GetResult();
        }
        static async Task MainAsync(string[] args)
        {
            try
            {
                if (config == null)
                {
                    Console.WriteLine("Config is not loaded. Exiting.");
                    return;
                }

                if (args.Length != 1)
                {
                    Console.WriteLine("Usage: <path_to_SheetsInfo.exe> <path_to_credentials.json>");
                    return;
                }

                string credentialsPath = args[0];
                GoogleCredential credential;

                using (var stream = new System.IO.FileStream(credentialsPath, System.IO.FileMode.Open, System.IO.FileAccess.Read))
                {
                    credential = GoogleCredential.FromStream(stream)
                        .CreateScoped(SheetsService.Scope.Spreadsheets);
                }

                var sheetsService = new SheetsService(new Google.Apis.Services.BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "YourAppName"
                });

                string sheetName = config.SheetName;
                string columnsRange = config.ColumnsRange;
                string dataRange = config.DataRange;

                // Запрос для получения названий столбцов
                var columnsRequest = sheetsService.Spreadsheets.Values.Get(config.SpreadsheetId, $"{sheetName}!{columnsRange}");
                var columnsResponse = await columnsRequest.ExecuteAsync();

                // Запрос для получения фактических данных
                var dataRequest = sheetsService.Spreadsheets.Values.Get(config.SpreadsheetId, $"{sheetName}!{dataRange}");
                var dataResponse = await dataRequest.ExecuteAsync();

                if (dataResponse.Values != null && dataResponse.Values.Count > 0)
                {
                    var dataList = new List<SheetData>();

                    foreach (var row in dataResponse.Values)
                    {
                        if (row.All(cell => cell == null || string.IsNullOrWhiteSpace(cell.ToString())))
                        {
                            continue; // Skip this row
                        }

                        var sheetData = new SheetData();

                        for (int i = 0; i < row.Count; i++)
                        {
                            string? cellValue = row[i]?.ToString();
                            switch (i)
                            {
                                case 0:
                                    sheetData.Date = cellValue ?? "";
                                    break;
                                case 1:
                                    sheetData.SubstPerson = cellValue ?? "";
                                    break;
                                case 2:
                                    sheetData.Lesson = cellValue ?? "";
                                    break;
                                case 3:
                                    sheetData.Class = cellValue ?? "";
                                    break;
                                case 5:
                                    sheetData.LessonRoom = cellValue ?? "";
                                    break;
                                case 6:
                                    sheetData.GraduatedTeacher = cellValue ?? "";
                                    break;
                                case 7:
                                    sheetData.Notes = cellValue ?? "";
                                    break;
                            }
                        }

                        dataList.Add(sheetData);
                    }

                    var jsonData = JsonConvert.SerializeObject(dataList, Formatting.Indented);

                    Console.WriteLine(jsonData);
                }
                else
                {
                    Console.WriteLine($"No data in range {sheetName}!{dataRange}.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
        }
        static void LoadConfig()
        {
            try
            {
                string currentDirectory = Path.GetDirectoryName(Assembly.GetEntryAssembly().Location);
                string configPath = Path.Combine(currentDirectory, config.ConfigPath);
                string json = File.ReadAllText(configPath);
                config = JsonConvert.DeserializeObject<Config>(json);

                if (config == null)
                {
                    config = new Config();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reading config file: {ex.Message}");
                config = null;
            }
        }
    }
}
