package com.sliit.vehiclerental.accesscontrol.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                    @Value("${app.jwt.expiration-ms}") long expirationMs) {
        // pad the configured secret so short dev secrets still work with HS256
        this.key = buildKey(secret);
        this.expirationMs = expirationMs;
    }

    private SecretKey buildKey(String secret) {
        byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
        if (raw.length < 32) {
            // dev convenience only - always set a real 256-bit secret in production
            byte[] padded = new byte[32];
            System.arraycopy(raw, 0, padded, 0, Math.min(raw.length, 32));
            raw = padded;
        }
        return Keys.hmacShaKeyFor(raw);
    }

    public String generateToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("uid", principal.getId())
                .claim("role", principal.getRoleName())
                .claim("perms", String.join(",", principal.getPermissionCodes()))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public List<String> extractPermissions(String token) {
        String perms = parseClaims(token).get("perms", String.class);
        if (perms == null || perms.isBlank()) return List.of();
        return java.util.Arrays.stream(perms.split(",")).collect(Collectors.toList());
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
