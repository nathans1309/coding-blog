> :Hero src=img/Tic_tac_toe.png,
>       mode=light,
>       target=desktop

> :Hero src=img/Tic_tac_toe.png,
>       mode=dark,
>       target=desktop

> :Title
>
> TicTacToe game using Blazor

> :Author name=Nathan Sweeney, 
>         avatar=img/nathan_headshot.jpg, 
>         date=2021-01-01

Recently, I decided to try to use Blazor's pub sub functionality to create a TicTacToe game. 
Specifically, I wanted to know if Blazor could be used to handle the gameplay communication between two players.
I'll share my experience, the advantages and the limitations of this design.

## Create a new Blazor Project
I followed this microsoft documentation to quickly setup a new blazor project.
[Blazor Quick Start](https://dotnet.microsoft.com/learn/aspnet/blazor-tutorial/intro)

## Add a Hub for gameplay messages
Before we add the hub, we will need to create a singleton class to track players at the gameboard. A queue will only allow two players and will remove the symbol when a new user is created. In the future, I need to add functionality to add the symbol back to the queue when the player disconnects and have the effect of making the seat available.
```csharp
public class PlayerFactory {
    private Queue<string> _Symbols = new Queue<string>();
    public PlayerFactory() {
        _Symbols.Enqueue("X");
        _Symbols.Enqueue("O");
    }

    public Player Create() => new Player {
        Symbol = _Symbols.Dequeue()
    };
}

public class Player {
    public string Symbol { get; set; }
}

```
> :Buttons
> > :CopyButton

Now we can create our Signalr Hub. We need to utilize the PlayerFactory to associate a symbol with a newly connected user, handle when a player claims a tile and allow clients to send general messages to the other players.

```csharp
public class GameHub : Hub {
  public const string HubUrl = "/play";
  private readonly PlayerFactory _playerFactory;
  public GameHub(PlayerFactory playerFactory) {
    _playerFactory = playerFactory;
  }
  public async Task Broadcast(string username, string message) // --> for sending general messages
  {
    await Clients.All.SendAsync("Broadcast", username, message);
  }
  public async Task Play(int x, int y, string symbol) // --> to claim a tile
  {  
    await Clients.All.SendAsync("Play", x, y, symbol);
  }
  // player init
  public override async Task OnConnectedAsync()
  {
    Console.WriteLine($"{Context.ConnectionId} connected");
    try { 
        var player = _playerFactory.Create();
        await Clients.Caller.SendAsync("Symbol", player.Symbol);
        await base.OnConnectedAsync()
    } catch(Exception e) {
      await Clients.Caller.SendAsync("Broadcast", $"[Notice] cannot join game.");
    }
  }
  public override async Task OnDisconnectedAsync(Exception e)
  {
    Console.WriteLine($"Disconnected {e?.Message} {Context.ConnectionId}");
    await base.OnDisconnectedAsync(e);
  }
}
```
> :Buttons
> > :CopyButton

We will need to register these classes in the Startup.cs file

in ConfigureServices method
```csharp
services.AddSingleton<PlayerFactory>();
```
in Configure method within `app.useEndpoints`
```csharp
endpoints.MapHub<GameHub>(GameHub.HubUrl);
```

and add the signalr client nuget package
```powershell
dotnet add package Microsoft.AspNetCore.SignalR.Client
```

Now we can add a new razor component called `GameBoard.razor` under our Pages folder. Our component contains a 3 x 3 grid of buttons to represent our tictactoe gameboard. Our general message board will display below the grid
> :Tabs
>> :Tab title=cshtml
>>```html | cshtml
>><h1>Play Tic Tac Toe</h1>
>><hr />
>>
>>@if (!_isChatting)
>>{
>>  <p>
>>    Enter your name to start playing:
>>  </p>
>>
>>  <input type="text" maxlength="32" @bind="@_username" />
>>  <button type="button" @onclick="@JoinGame"><span class="oi oi-chat" aria-hidden="true"></span> Play!</button>
>>
>>  // Error messages
>>  @if (_message != null)
>>  {
>>    <div class="invalid-feedback">@_message</div>
>>    <small id="emailHelp" class="form-text text-muted">@_message</small>
>>  }
>>}
>>else
>>{
>>  @if (!String.IsNullOrEmpty(_symbol))
>>  {
>>    <small class="form-text text-muted">My Symbol is @_symbol</small>
>>  }
>>
>>  @for (var row = 0; row < 3; row++)
>>  {
>>    <div class="row">
>>      @for (var col = 0; col < 3; col++)
>>      {
>>        var tempRow = row;
>>        var tempCol = col;
>>        <button type="button" class="col-sm-4" @onclick="@(e => ClaimSpace(tempRow,tempCol))">@_board[tempRow, tempCol]</button>
>>      }
>>    </div>
>>  }
>>
>>  // banner to show current user
>>  <div class="alert alert-secondary mt-4" role="alert">
>>    <span class="oi oi-person mr-2" aria-hidden="true"></span>
>>    <span>You are connected as <b>@_username</b></span>
>>    <button class="btn btn-sm btn-warning ml-md-auto" @onclick="@DisconnectAsync">Disconnect</button>
>>  </div>
>>
>>  // display messages
>>  <div id="scrollbox">
>>    @foreach (var item in _messages)
>>    {
>>      @if (item.IsNotice)
>>      {
>>        <div class="alert alert-info">@item.Body</div>
>>      }
>>      else
>>      {
>>        <div class="@item.CSS">
>>          <div class="user">@item.Username</div>
>>          <div class="msg">@item.Body</div>
>>        </div>
>>      }
>>    }
>>  </div>
>>}
>>```
>>> :Buttons
>>>> :CopyButton
>
>> :Tab title=wwwroot/css/site.css
>> ```css | css
>> @import url('open-iconic/font/css/open-iconic-bootstrap.min.css');
>> 
>> html, body {
>>     font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
>> }
>> 
>> a, .btn-link {
>>     color: #0366d6;
>> }
>> 
>> .btn-primary {
>>     color: #fff;
>>     background-color: #1b6ec2;
>>     border-color: #1861ac;
>> }
>> 
>> .content {
>>     padding-top: 1.1rem;
>> }
>> 
>> .valid.modified:not([type=checkbox]) {
>>     outline: 1px solid #26b050;
>> }
>> 
>> .invalid {
>>     outline: 1px solid red;
>> }
>> 
>> .validation-message {
>>     color: red;
>> }
>> 
>> #blazor-error-ui {
>>     background: lightyellow;
>>     bottom: 0;
>>     box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.2);
>>     display: none;
>>     left: 0;
>>     padding: 0.6rem 1.25rem 0.7rem 1.25rem;
>>     position: fixed;
>>     width: 100%;
>>     z-index: 1000;
>> }
>> 
>> #blazor-error-ui .dismiss {
>>     cursor: pointer;
>>     position: absolute;
>>     right: 0.75rem;
>>     top: 0.5rem;
>> }
>> /* improved for chat text box */
>> textarea {
>>   border: 1px dashed #888;
>>   border-radius: 5px;
>>   width: 80%;
>>   overflow: auto;
>>   background: #f7f7f7
>> }
>> 
>> /* improved for speech bubbles */
>> .received, .sent {
>>   position: relative;
>>   font-family: arial;
>>   font-size: 1.1em;
>>   border-radius: 10px;
>>   padding: 20px;
>>   margin-bottom: 20px;
>> }
>> 
>> .received:after, .sent:after {
>>   content: '';
>>   border: 20px solid transparent;
>>   position: absolute;
>>   margin-top: -30px;
>> }
>> 
>> .sent {
>>   background: #03a9f4;
>>   color: #fff;
>>   margin-left: 10%;
>>   top: 50%;
>>   text-align: right;
>> }
>> 
>> .received {
>>   background: #4CAF50;
>>   color: #fff;
>>   margin-left: 10px;
>>   margin-right: 10%;
>> }
>> 
>> .sent:after {
>>   border-left-color: #03a9f4;
>>   border-right: 0;
>>   right: -20px;
>> }
>> 
>> .received:after {
>>   border-right-color: #4CAF50;
>>   border-left: 0;
>>   left: -20px;
>> }
>> 
>> /* div within bubble for name */
>> .user {
>>   font-size: 0.8em;
>>   font-weight: bold;
>>   color: #000;
>> }
>> 
>> .msg {
>>   /*display: inline;*/
>> }
>> ```
>>> :Buttons
>>>> :CopyButton

add imports above the html
```csharp
@page "/game"
@inject NavigationManager navigationManager
@using Microsoft.AspNetCore.SignalR.Client;
```

add code to the bottom of the html. I initialized the game board values as a 3 x 3 array 
```csharp
@code {
  private bool _isChatting = false;
  private string _username;
  private string _symbol;
  private string[,] _board = new string[3, 3] { { "[ ]", "[ ]", "[ ]" }, { "[ ]", "[ ]", "[ ]" }, { "[ ]", "[ ]", "[ ]" } };
  private string _message;
  private string _newMessage;
  private List<Message> _messages = new List<Message>();

  private string _hubUrl;
  private HubConnection _hubConnection;

  public async Task JoinGame()
  {
    // check username is valid
    if (string.IsNullOrWhiteSpace(_username))
    {
      _message = "Please enter a name";
      return;
    };

    try
    {
      _isChatting = true;
      await Task.Delay(1);
      _messages.Clear();

      string baseUrl = navigationManager.BaseUri;

      _hubUrl = baseUrl.TrimEnd('/') + GameHub.HubUrl;

      _hubConnection = new HubConnectionBuilder()                           // --> connect to SignalR
        .WithUrl(_hubUrl)
        .Build();

      _hubConnection.On<string, string>("Broadcast", BroadcastMessage);     // --> handle general messages
      _hubConnection.On<string>("Symbol", HandleSymbol);                    // --> after a user connects they are given back a symbol and need to store their symbol
      _hubConnection.On<int, int, string>("Play", HandlePlay);              // --> whenever the other player has claimed a tile, our game board needs to update

      await _hubConnection.StartAsync();

      await SendAsync($"[Notice] {_username} joined chat room.");
    }
    catch (Exception e)
    {
      _message = $"ERROR: Failed to start chat client: {e.Message}";
      _isChatting = false;
    }
  }

  private void HandleSymbol(string symbol) 
  {
    _symbol = symbol;
  }

  private void HandlePlay(int x, int y, string symbol) 
  {
    _board[x, y] = symbol;
    _messages.Add(new Message("", symbol, false));
    StateHasChanged();
  }

  private void BroadcastMessage(string name, string message)
  {
    bool isMine = name.Equals(_username, StringComparison.OrdinalIgnoreCase);

    _messages.Add(new Message(name, message, isMine));
    StateHasChanged();
  }

  private async Task DisconnectAsync()
  {
    if (_isChatting)
    {
      await SendAsync($"[Notice] {_username} left chat room.");

      await _hubConnection.StopAsync();
      await _hubConnection.DisposeAsync();

      _hubConnection = null;
      _isChatting = false;
    }
  }

  private async Task SendAsync(string message)
  {
    if (_isChatting && !string.IsNullOrWhiteSpace(message))
    {
      await _hubConnection.SendAsync("Broadcast", _username, message);

      _newMessage = string.Empty;
    }
  }

  private async Task ClaimSpace(int x, int y) // --> notify everyone (including ourself) that we claimed a space
  {
    if (!string.IsNullOrEmpty(_symbol))
    {
      await _hubConnection.SendAsync("Play", x, y, _symbol);
    }
  }

  private class Message
  {
    public Message(string username, string body, bool mine)
    {
      Username = username;
      Body = body;
      Mine = mine;
    }

    public string Username { get; set; }
    public string Body { get; set; }
    public bool Mine { get; set; }

    public bool IsNotice => Body.StartsWith("[Notice]");

    public string CSS => Mine ? "sent" : "received";
  }
}
```
> :Buttons
> > :CopyButton

In order to use our component, we need to replace the contents of `Index.razor` with `<GameBoard />`

## Try it out
run the project either with Visual Studio or `dotnet run` and open up another browser tab under the same port.
Then, enter names for both players and click the buttons to watch the gameboard update for the other player

## What's left
As is stands, the application still has a few bugs.
- It would be nice if the server re-allocated a player's seat and symbol when disconnecting.
- It would be great if the game would wait to start until there are two players and also pause or start over if one of the players left.
- The game also needs to handle the end whether win, tie or lose.
- Right now, a player could click on a already claimed space and take over that tile, each tile space in the grid should disable once it has been claimed.
- Claiming a tile should only be possible on a players turn and after claiming a tile, the player's turn should be over and the available tiles disabled until it's their turn again
Hopefully we can improve this over time in future posts.