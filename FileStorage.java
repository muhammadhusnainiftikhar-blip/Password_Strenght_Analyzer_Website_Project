import java.io.*;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

public class FileStorage {
    private static final String CSV_FILE = "password_reports.csv";
    private static Set<String> savedPasswords = new HashSet<>(); // Track saved passwords
    
    public static synchronized void saveToCSV(String password, PasswordStats stats, String crackTime) {
        try {
            // Optional: Uncomment to avoid duplicate entries
            // String passwordKey = password + "_" + new SimpleDateFormat("yyyyMMddHH").format(new Date());
            // if (savedPasswords.contains(passwordKey)) return;
            // savedPasswords.add(passwordKey);
            
            File file = new File(CSV_FILE);
            boolean fileExists = file.exists();
            
            FileWriter fw = new FileWriter(CSV_FILE, true);
            PrintWriter pw = new PrintWriter(fw);
            
            if (!fileExists) {
                pw.println("Timestamp,Password,Length,Uppercase,Lowercase,Numbers,Special,CharacterSetSize,CrackTime,ComplexityScore");
            }
            
            String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
            
            pw.printf("%s,\"%s\",%d,%d,%d,%d,%d,%d,%s,%d%n",
                timestamp, escapeCSV(password), stats.length, stats.upper, 
                stats.lower, stats.digits, stats.special, stats.charSet, 
                crackTime, stats.complexityScore);
            
            pw.close();
            System.out.println("✅ Auto-saved: \"" + password + "\" at " + timestamp);
        } catch (IOException e) {
            System.err.println("❌ Error saving to CSV: " + e.getMessage());
        }
    }
    
    private static String escapeCSV(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return value.replace("\"", "\"\"");
        }
        return value;
    }
}