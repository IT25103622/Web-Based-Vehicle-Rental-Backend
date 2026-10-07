package com.sliit.vehiclerental.security;

import com.sliit.vehiclerental.customer.entity.CustomerUser;
import com.sliit.vehiclerental.customer.repository.CustomerUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomerUserRepository customerUserRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, CustomerUserRepository customerUserRepository) {
        this.jwtUtil = jwtUtil;
        this.customerUserRepository = customerUserRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();

            if (jwtUtil.isTokenValid(token)) {
                Long userId = jwtUtil.extractUserId(token);
                String email = jwtUtil.extractEmail(token);
                String role = jwtUtil.extractRole(token);

                String fullName = email;
                if (userId != null) {
                    CustomerUser user = customerUserRepository.findById(userId).orElse(null);
                    if (user != null && "ACTIVE".equalsIgnoreCase(user.getStatus())) {
                        fullName = user.getFullName();
                    }
                }

                UserPrincipal principal = UserPrincipal.create(userId, email, fullName, role);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }
}
