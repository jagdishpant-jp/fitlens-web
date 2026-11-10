// FitLens configuration
// Base Logic App HTTP URLs (ending in ...&sig=XXXX). The app adds &trainerId / &id itself.
// These URLs contain secret signatures: keep this file out of public screenshots.

const FITLENS_CONFIG = {
  IUPS_URL: "https://prod-26.francecentral.logic.azure.com:443/workflows/ecded4c0accc4be381ecbc94aadc1b47/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=fd4iRKHx3_kpm6Hv23cwsI9o5bZr3QZgrls_9K_Rlys",
  RAI_URL:  "https://prod-16.francecentral.logic.azure.com:443/workflows/16bd93c78f0e4b1cb189396f40e61803/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=45E0pLfzJigpWgMSue8XxPXNYaEicfQl_jkv84LZgQw",
  RIPS_URL: "https://prod-15.francecentral.logic.azure.com:443/workflows/23f66153dca4495a9fbdde96801bf749/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=uW05D94xHQTjTQxuxQC5br_siyRdx6oP4-C9g8EFgk8",
  UIPS_URL: "https://prod-20.francecentral.logic.azure.com:443/workflows/32b1907635064133a2ee8bbbf78868b0/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=EjHY4yGtH2RT2yCkNcGkZQt3iL7GKN9lYxZLiBw_ScM",
  DIPS_URL: "https://prod-20.francecentral.logic.azure.com:443/workflows/910ebf18560b40d2aac6a244a44fe3bc/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=MaEbKmLAt1QgcB9onTWNb93h5BfrwE2HzTiXY0t0_tk",
    INSIGHTS_URL:  "https://fitlens-func-jp-d4e0fvg4gde9ewdn.francecentral-01.azurewebsites.net/api/insights?code=nDR7ru9WtMsHMqfY0HujNlDIHL3TVWpNZkKg_mijHNaGAzFueJE--g==",
  TRANSLATE_URL: "https://fitlens-func-jp-d4e0fvg4gde9ewdn.francecentral-01.azurewebsites.net/api/translate?code=nDR7ru9WtMsHMqfY0HujNlDIHL3TVWpNZkKg_mijHNaGAzFueJE--g==",

  // Demo users (matches the CW1 design)
  TRAINER_ID: "tr-042",
  TRAINER_NAME: "Jagdish Pant",
  CLIENT_ID: "cl-1187",
  CLIENT_NAME: "Rajesh Pant"
};