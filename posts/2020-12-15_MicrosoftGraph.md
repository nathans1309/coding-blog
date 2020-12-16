> :Hero src=img/MicrosoftGraph.png,
>       mode=light,
>       target=desktop,
>       leak=200px

> :Hero src=img/MicrosoftGraph.png,
>       mode=dark,
>       target=desktop,
>       leak=200px

> :Title
>
> Integrating dotnet core application with the Microsoft Graph API

> :Author name=Nathan Sweeney, 
>         avatar=img/nathan_headshot.jpg, 
>         date=2020-12-15

This post is about integrating your dotnet core application with the Microsoft Graph API. I specifically had interest in managing Microsoft Teams but this could be applied to any graph integration.

## Create an application in Azure
First, sign into [Azure Portal](https://portal.azure.com) and navigate to Azure Active Directory
Register a new application and obtain an access code following this [getting started](https://docs.microsoft.com/en-us/graph/auth-register-app-v2)

- Under menu item 'Certificates and Secrets', make sure to generate a Secret if not already exists. Save the secret as this will be used for the Client Secret later.
- Under menu item 'API Permissions', add access to the scopes that you want to query. It is probably worth taking a minute to understand what all the different scopes mean. Later when we generate a token, if we ask for a scope that isn't configured then our request for a token will be denied. You might need an azure portal admin to approve certain scopes.

## Add the Authorization Code Provider
Create a new dotnet core project and add nuget packages `Microsoft.Graph` and `Microsoft.Identity.Client`

Create a class for the Microsoft Graph config and a provider class to obtain the Auth token. The benefit in a new provider class is that we can store state about the `_userAccount` which lets us reuse the account and also ask for another auth token silently as needed.

Notice that I used `ConfidentialClientApplicationBuilder`. There are different builders that support [different Authentication work flows](https://docs.microsoft.com/en-us/graph/sdks/choose-authentication-providers?tabs=CS). This one follows the **Authorization Code Flow** and allows me to generate a single token instead of generating a token per user which means I can work silently without requiring the user to have a microsoft account.

```csharp
public class MSAConfig {
    public string ClientId { get; set; }
    public string ClientSecret { get; set; }
    public string Authority { get; set; }
}

public class AuthCodeProvider : IAuthenticationProvider {
private IConfidentialClientApplication _msalClient;
private string[] _scopes;
private IAccount _userAccount;

public AuthCodeProvider(string[] scopes, MSAConfig config) {
    _scopes = scopes;
/*!*/    _msalClient = ConfidentialClientApplicationBuilder
        .Create(config.ClientId)
        .WithClientSecret(config.ClientSecret)
        .WithAuthority(new Uri(config.Authority))
        .Build();
}

public async Task<string> GetAccessToken() {
    // If there is no saved user account, the user must sign-in
    if (_userAccount == null) {
        try {
            // Invoke device code flow so user can sign-in with a browser
            var result = await _msalClient.AcquireTokenForClient(_scopes).ExecuteAsync();

            _userAccount = result.Account;
            return result.AccessToken;
        }
        catch (Exception exception) {
            Console.WriteLine($"Error getting access token: {exception.Message}");
            return null;
        }
    } else {
        // If there is an account, call AcquireTokenSilent
        // By doing this, MSAL will refresh the token automatically if
        // it is expired. Otherwise it returns the cached token.

        var result = await _msalClient
            .AcquireTokenSilent(_scopes, _userAccount)
            .ExecuteAsync();

        return result.AccessToken;
    }
}

    // This is the required function to implement IAuthenticationProvider
    // The Graph SDK will call this function each time it makes a Graph
    // call.
    public async Task AuthenticateRequestAsync(HttpRequestMessage requestMessage) {
        requestMessage.Headers.Authorization =
            new AuthenticationHeaderValue("bearer", await GetAccessToken());
    }
}
```

## Build the configuration to authorize
Let's add constants that will allow us to authorize a token from graph.
- clientId, clientSecret and tenantId are all specific to the newly registered application
- the resourceId is the resource to which we are requesting scoped access
- scopes are the permissions that we are claiming to need. These permissions will be baked into the access token and validated per api request to ensure we have access to what we are querying. `.default` is a way to ask for all of the scopes allowed to this application
- authority is the identity provider that will be authenticating before we can have an access token

```csharp
var clientID = "The id of the registered application in azure. Known as ApplicationId or ClientId";
var clientSecret = "The Client Secret that was generated earlier";
var tenantId = "Registered apps's TenantId";
var resourceId = "https://graph.microsoft.com";
var scopes = new[] { resourceId + "/.default" };
var authority = $"https://login.microsoftonline.com/{tenantId}";
```

## Make the request to graph api
Now we can add a generic http response handler for Microsoft Graph responses. This could also be done in an Http wrapper class but I chose a more functional approach this time.

```csharp
public static async Task<T> GetGraph<T>(HttpClient httpClient, string url)
{
    var response = await httpClient.GetAsync(url);
    var json = await response.Content.ReadAsStringAsync();
    var val = JObject.Parse(json)["value"];
    return val.ToObject<T>();
}
```
Setup the HttpClient and add an auth token as an authentication Bearer header. There is likely a graph sdk that could be used instead but it's easy enough to create our own HttpClient and then we have more control.
```csharp
var authProvider = new DeviceCodeAuthProvider(scopes, new MSAConfig { Authority = authority, ClientId = clientID, ClientSecret = clientSecret });
var token = await authProvider.GetAccessToken();

var httpClient = new HttpClient();
httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
```

Now we can pass our http client into our wrapper method to call the graph api. Review the microsoft graph api docs for the correct url. Here we're getting users, groups and members.

```csharp
var usersUrl = "https://graph.microsoft.com/v1.0/users";
var groupsUrl = "https://graph.microsoft.com/v1.0/groups";
string membershipsUrl(Guid groupId) => $"https://graph.microsoft.com/v1.0/teams/{groupId}/members";

var users = await GetGraph<List<User>>(httpClient, usersUrl);
var groups = await GetGraph<List<Group>>(httpClient, groupsUrl);
var memberships = await GetGraph<List<Membership>>(httpClient, membershipsUrl(groups.First().Id));
```

Hopefully, this is helpful to you and gets you started on your integration with Microsoft Graph Api.