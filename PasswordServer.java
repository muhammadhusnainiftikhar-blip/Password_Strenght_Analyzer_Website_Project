import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

public class PasswordServer {
    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        server.createContext("/analyze", new AnalyzeHandler());
        server.createContext("/save", new SaveHandler());
        server.setExecutor(Executors.newCachedThreadPool());
        
        server.start();
        System.out.println("🚀 Password Analyzer Server running on http://localhost:8080");
        System.out.println("📊 Open index.html to start analyzing passwords");
        System.out.println("💾 Every password you type will be auto-saved to CSV!");
        System.out.println("⚠️  Press Ctrl+C to stop the server\n");
    }
    
    static class AnalyzeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String password = "";
            
            if (query != null && query.contains("password=")) {
                password = URLDecoder.decode(query.split("=")[1], StandardCharsets.UTF_8);
            }
            
            PasswordStats stats = PasswordAnalyzer.analyze(password);
            
            // AUTO-SAVE every password that is analyzed (non-empty)
            if (password != null && password.length() > 0) {
                String crackTime = formatTime(stats.crackSeconds);
                FileStorage.saveToCSV(password, stats, crackTime);
            }
            
            String jsonResponse = stats.toJSON();
            
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.sendResponseHeaders(200, jsonResponse.length());
            
            OutputStream os = exchange.getResponseBody();
            os.write(jsonResponse.getBytes());
            os.close();
        }
        
        private String formatTime(double seconds) {
            if (seconds < 60) return String.format("%.0f seconds", seconds);
            if (seconds < 3600) return String.format("%.1f minutes", seconds/60);
            if (seconds < 86400) return String.format("%.1f hours", seconds/3600);
            if (seconds < 31536000) return String.format("%.1f days", seconds/86400);
            return String.format("%.2f years", seconds/31536000);
        }
    }
    
    static class SaveHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String password = "";
            
            if (query != null && query.contains("password=")) {
                password = URLDecoder.decode(query.split("=")[1], StandardCharsets.UTF_8);
            }
            
            PasswordStats stats = PasswordAnalyzer.analyze(password);
            String crackTime = formatTime(stats.crackSeconds);
            FileStorage.saveToCSV(password, stats, crackTime);
            
            String response = "{\"status\":\"saved\"}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.sendResponseHeaders(200, response.length());
            
            OutputStream os = exchange.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
        
        private String formatTime(double seconds) {
            if (seconds < 60) return String.format("%.0f seconds", seconds);
            if (seconds < 3600) return String.format("%.1f minutes", seconds/60);
            if (seconds < 86400) return String.format("%.1f hours", seconds/3600);
            if (seconds < 31536000) return String.format("%.1f days", seconds/86400);
            return String.format("%.2f years", seconds/31536000);
        }
    }
}