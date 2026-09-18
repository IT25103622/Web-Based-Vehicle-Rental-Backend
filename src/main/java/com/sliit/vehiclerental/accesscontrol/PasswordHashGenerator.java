package com.sliit.vehiclerental.accesscontrol;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Scanner;

/**
 * Standalone helper - NOT part of the running application. Prints the MD5
 * hash for a password (matching the app's Md5PasswordEncoder) plus a
 * ready-to-run UPDATE query.
 *
 * You usually don't even need this tool anymore: since the app now hashes
 * with plain MD5, you can just run the UPDATE directly in MySQL using its
 * built-in MD5() function, e.g.:
 *
 *   UPDATE users SET password_hash = MD5('newpassword'), must_change_password = 0
 *   WHERE email = 'someone@example.com';
 *
 * This class is kept around for convenience / for anyone who'd rather not
 * open a MySQL client.
 *
 * Run this file directly in IntelliJ (right-click -> Run 'main()').
 * Prefer the app's own password reset / change-password features when
 * possible - those write an entry to the audit log; this does not.
 */
public class PasswordHashGenerator {

    public static void main(String[] args) throws Exception {
        String rawPassword;
        if (args.length > 0) {
            rawPassword = args[0];
        } else {
            System.out.print("Enter the password to hash: ");
            Scanner scanner = new Scanner(System.in);
            rawPassword = scanner.nextLine();
        }

        String hash = md5Hex(rawPassword);

        System.out.println();
        System.out.println("MD5 hash:");
        System.out.println(hash);
        System.out.println();
        System.out.println("SQL to update a user's password:");
        System.out.println("UPDATE users SET password_hash = '" + hash + "', must_change_password = 0 WHERE email = 'THEIR_EMAIL_HERE';");
        System.out.println();
        System.out.println("Or just run this directly in MySQL, no Java needed:");
        System.out.println("UPDATE users SET password_hash = MD5('" + rawPassword + "'), must_change_password = 0 WHERE email = 'THEIR_EMAIL_HERE';");
    }

    private static String md5Hex(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
