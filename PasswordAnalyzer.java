public class PasswordAnalyzer {
    public static PasswordStats analyze(String password) {
        int upper = 0, lower = 0, digits = 0, special = 0;
        
        if (password == null || password.isEmpty()) {
            return new PasswordStats(0, 0, 0, 0, 0, 0, 0, 0);
        }
        
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) upper++;
            else if (Character.isLowerCase(c)) lower++;
            else if (Character.isDigit(c)) digits++;
            else special++;
        }
        
        int charSetSize = 0;
        if (upper > 0) charSetSize += 26;
        if (lower > 0) charSetSize += 26;
        if (digits > 0) charSetSize += 10;
        if (special > 0) charSetSize += 33;
        
        // Handle edge case when charSetSize is 0 (empty password)
        if (charSetSize == 0) charSetSize = 1;
        
        double totalCombinations = Math.pow(charSetSize, password.length());
        long cracksPerSecond = 1_000_000_000L;
        double secondsToCrack = totalCombinations / cracksPerSecond;
        
        int complexityScore = calculateComplexity(password.length(), charSetSize, upper, lower, digits, special);
        
        return new PasswordStats(upper, lower, digits, special, password.length(), 
                                 secondsToCrack, charSetSize, complexityScore);
    }
    
    private static int calculateComplexity(int length, int charSet, int upper, int lower, int digits, int special) {
        int score = 0;
        
        // Length contribution (max 25 points)
        score += Math.min(25, (length * 25 / 20));
        
        // Character type contribution (max 25 points)
        int typeCount = 0;
        if (upper > 0) typeCount++;
        if (lower > 0) typeCount++;
        if (digits > 0) typeCount++;
        if (special > 0) typeCount++;
        score += typeCount * 6;
        
        // Bonus for combinations (max 50 points)
        if (upper > 0 && lower > 0) score += 10;
        if (digits > 0) score += 10;
        if (special > 0) score += 15;
        
        return Math.min(100, Math.max(0, score));
    }
}

class PasswordStats {
    int upper, lower, digits, special, length, charSet, complexityScore;
    double crackSeconds;
    
    public PasswordStats(int upper, int lower, int digits, int special, int length, 
                        double crackSeconds, int charSet, int complexityScore) {
        this.upper = upper;
        this.lower = lower;
        this.digits = digits;
        this.special = special;
        this.length = length;
        this.crackSeconds = crackSeconds;
        this.charSet = charSet;
        this.complexityScore = complexityScore;
    }
    
    public String toJSON() {
        return String.format(
            "{\"upper\":%d,\"lower\":%d,\"digits\":%d,\"special\":%d,\"length\":%d,\"crackSeconds\":%f,\"charSet\":%d,\"complexityScore\":%d}",
            upper, lower, digits, special, length, crackSeconds, charSet, complexityScore
        );
    }
}