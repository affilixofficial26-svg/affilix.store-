using System.Diagnostics;
using System.Net;
using System.Text;

namespace AffilixDesktop;

internal static class Program
{
    private static readonly string[] CandidateFiles =
    [
        "login-preview.html",
        "affilix-completo.html",
        "preview.html",
        "LOGO.png"
    ];

    public static async Task Main()
    {
        var contentRoot = ResolveContentRoot();
        var port = FindAvailablePort(3050, 3090);
        var prefix = $"http://localhost:{port}/";
        using var listener = new HttpListener();
        listener.Prefixes.Add(prefix);
        listener.Start();

        Console.Title = "AFFILIX Desktop";
        Console.WriteLine("AFFILIX Desktop iniciado.");
        Console.WriteLine($"Servidor local: {prefix}");
        Console.WriteLine("Cierra esta ventana para cerrar el programa.");

        OpenBrowser($"{prefix}login-preview.html");

        while (listener.IsListening)
        {
            var context = await listener.GetContextAsync();
            _ = Task.Run(() => ServeRequest(context, contentRoot));
        }
    }

    private static string ResolveContentRoot()
    {
        var baseDir = AppContext.BaseDirectory;
        if (CandidateFiles.Any(file => File.Exists(Path.Combine(baseDir, file))))
        {
            return baseDir;
        }

        var currentDir = Directory.GetCurrentDirectory();
        if (CandidateFiles.Any(file => File.Exists(Path.Combine(currentDir, file))))
        {
            return currentDir;
        }

        throw new DirectoryNotFoundException("No se encontraron los archivos HTML de AFFILIX junto al ejecutable.");
    }

    private static int FindAvailablePort(int start, int end)
    {
        for (var port = start; port <= end; port++)
        {
            try
            {
                using var probe = new HttpListener();
                probe.Prefixes.Add($"http://localhost:{port}/");
                probe.Start();
                probe.Stop();
                return port;
            }
            catch
            {
                continue;
            }
        }

        throw new InvalidOperationException("No hay puertos libres entre 3050 y 3090.");
    }

    private static void ServeRequest(HttpListenerContext context, string contentRoot)
    {
        try
        {
            var requestPath = WebUtility.UrlDecode(context.Request.Url?.AbsolutePath.TrimStart('/') ?? "");
            if (string.IsNullOrWhiteSpace(requestPath))
            {
                requestPath = "login-preview.html";
            }

            var fullPath = Path.GetFullPath(Path.Combine(contentRoot, requestPath));
            if (!fullPath.StartsWith(Path.GetFullPath(contentRoot), StringComparison.OrdinalIgnoreCase) || !File.Exists(fullPath))
            {
                WriteText(context, "Archivo no encontrado", "text/plain; charset=utf-8", 404);
                return;
            }

            var extension = Path.GetExtension(fullPath).ToLowerInvariant();
            var contentType = extension switch
            {
                ".html" => "text/html; charset=utf-8",
                ".css" => "text/css; charset=utf-8",
                ".js" => "application/javascript; charset=utf-8",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".svg" => "image/svg+xml",
                ".ico" => "image/x-icon",
                _ => "application/octet-stream"
            };

            var bytes = File.ReadAllBytes(fullPath);
            context.Response.ContentType = contentType;
            context.Response.ContentLength64 = bytes.Length;
            context.Response.OutputStream.Write(bytes, 0, bytes.Length);
            context.Response.Close();
        }
        catch (Exception ex)
        {
            WriteText(context, ex.Message, "text/plain; charset=utf-8", 500);
        }
    }

    private static void WriteText(HttpListenerContext context, string text, string contentType, int statusCode)
    {
        var bytes = Encoding.UTF8.GetBytes(text);
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = contentType;
        context.Response.ContentLength64 = bytes.Length;
        context.Response.OutputStream.Write(bytes, 0, bytes.Length);
        context.Response.Close();
    }

    private static void OpenBrowser(string url)
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
    }
}
