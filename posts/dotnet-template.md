> :Hero src=https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1900&h=600&fit=crop,
>       mode=light,
>       target=desktop,
>       leak=156px

> :Hero src=https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=600&fit=crop,
>       mode=light,
>       target=mobile,
>       leak=96px

> :Hero src=https://images.unsplash.com/photo-1508780709619-79562169bc64?w=1900&h=600&fit=crop,
>       mode=dark,
>       target=desktop,
>       leak=156px

> :Hero src=https://images.unsplash.com/photo-1508780709619-79562169bc64?w=1200&h=600&fit=crop,
>       mode=dark,
>       target=mobile,
>       leak=96px

> :Title shadow=0 0 8px black, color=white
>
> Create a template for dotnet

> :Author src=github

<br>

In the past, creating a new project always began with copying a template repository and renaming all of the 'Template' occurances with the new project name. But that gets old really fast. It doesn't happen often enough for my memory to make it efficient and I can't seem to easily hand it off to another developer. I had decided to add a <strong>Readme</strong> to the project but thought it worth the effort to try my hand at a dotnet template. I started by creating a project template according to these docs [here](https://docs.microsoft.com/en-us/dotnet/core/tutorials/cli-templates-create-project-template) and also wrapping that in a nuget package [here](https://docs.microsoft.com/en-us/dotnet/core/tutorials/cli-templates-create-template-pack). All is well so far, but now I wanted to make my entire folder structure with multiple projects to be wrapped in a template. Now on my own, I begin the google journey and landed on this folder structure

![Template Structure](img/template_structure.png)

A couple things to notice: 
1. everything is under the `/templates` folder and the TemplatePack project. TemplatePack project will be doing the work to package each template into a nuget package.
2. each directory under the `/templates` directory is one template (for ex. WebApp)
3. There should be only one `.template.config` per template directory

Here is the `TemplatePack.csproj` file
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <PackageType>Template</PackageType>
    <PackageId>Templates</PackageId>
    <Title>My Templates</Title>
    <Authors>Nathan Sweeney</Authors>
    <Description>Templates to use when creating a dotnet core application.</Description>
    <PackageTags>dotnet-new;templates;</PackageTags>

    <TargetFramework>netstandard2.1</TargetFramework>

    <IncludeContentInPack>true</IncludeContentInPack>
    <IncludeBuildOutput>false</IncludeBuildOutput>
    <ContentTargetFolders>content</ContentTargetFolders>
    <NoDefaultExcludes>true</NoDefaultExcludes>
  </PropertyGroup>

  <ItemGroup>
    <Content Include="WebApp\**" Exclude="WebApp\**\bin\**;WebApp\**\obj\**;WebApp\**\node_modules\**;WebApp\**\.vs\**" />
    <Compile Remove="**\*" />
  </ItemGroup>

</Project>
```
The above project file configures how this project is packaged. **PackageType** and **PackageTags** help define this nuget package as a template that can be installed via `dotnet new -i`. By default `dotnet pack` excludes files and folders that begin with '.' so **NoDefaultExcludes** is important here to include *.gitignore* as well as *.env*. We want to treat all the template code as content but not compile it which is why everything is included as **Content** but not **Compile**. Also notice that an additional **Content** element will be necessary for each new template.  


Here is the `template.json`
```json
{
    "$schema": "http://json.schemastore.org/template",
    "author": "Nathan Sweeney",
    "classifications": [ "Console", "C#", "Web" ],
    "identity": "MyTemplate",
    "name": "My Template for dotnet core",
    "shortName": "mytemplatecsharp",
    "tags": {
        "language": "C#",
        "type": "project"
    },
    "sourceName": "MyTemplate"
}
```
This json will configure the template once it's installed using `dotnet new -i`.


Now we can publish this template by using `dotnet pack -o artifacts` (I'm using powershell) from the root of the TemplatePack project.
The template can then be installed using the absolute path `dotnet new -i C:/code/..../artifacts/Templates.1.0.0.nupkg`
After installing, you should see your new template in the list.
To uninstall, first type `dotnet new -u`. Find your template (it should be the last one). Copy the uninstall command, paste and hit enter.


---

> :DarkLight
> > :InDark
> >
> > _Hero image by [Kaitlyn Baker](https://unsplash.com/@kaitlynbaker) from [Unsplash](https://unsplash.com)_
>
> > :InLight
> >
> > _Hero image by [Glenn Carstens-Peters](https://unsplash.com/@glenncarstenspeters) from [Unsplash](https://unsplash.com)_