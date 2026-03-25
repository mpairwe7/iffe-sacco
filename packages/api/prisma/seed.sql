-- IFFE SACCO Complete Database Seed
-- All passwords: password123

-- Clean (order matters for FK constraints)
DELETE FROM audit_logs;
DELETE FROM pledges;
DELETE FROM transactions;
DELETE FROM deposit_requests;
DELETE FROM withdraw_requests;
DELETE FROM loans;
DELETE FROM accounts;
DELETE FROM expenses;
DELETE FROM welfare_programs;
DELETE FROM bank_accounts;
DELETE FROM payment_gateways;
DELETE FROM settings;
DELETE FROM members;
DELETE FROM users;

-- ===== USERS (8) =====
INSERT INTO users (id, name, email, phone, password, role, "isActive", "lastLogin", "createdAt", "updatedAt") VALUES
('a0000001-0000-0000-0000-000000000001', 'Admin User', 'admin@iffeds.org', '+256700000001', '$2b$12$KddyygXOvn/.IPpI8LPE7O9uFPKkMaIwr8sX8MtYvJQ3CcxigVvZa', 'admin', true, NOW(), NOW(), NOW()),
('a0000001-0000-0000-0000-000000000002', 'Super Admin', 'superadmin@iffeds.org', '+256700000002', '$2b$12$KddyygXOvn/.IPpI8LPE7O9uFPKkMaIwr8sX8MtYvJQ3CcxigVvZa', 'admin', true, NOW()-interval '1 day', NOW(), NOW()),
('a0000001-0000-0000-0000-000000000003', 'Jane Teller', 'staff@iffeds.org', '+256700000003', '$2b$12$KddyygXOvn/.IPpI8LPE7O9uFPKkMaIwr8sX8MtYvJQ3CcxigVvZa', 'staff', true, NOW(), NOW(), NOW()),
('a0000001-0000-0000-0000-000000000004', 'Mike Cashier', 'mike@iffeds.org', '+256700000004', '$2b$12$KddyygXOvn/.IPpI8LPE7O9uFPKkMaIwr8sX8MtYvJQ3CcxigVvZa', 'staff', true, NOW()-interval '2 days', NOW(), NOW()),
('a0000001-0000-0000-0000-000000000005', 'Sarah Support', 'sarah.s@iffeds.org', '+256700000005', '$2b$12$KddyygXOvn/.IPpI8LPE7O9uFPKkMaIwr8sX8MtYvJQ3CcxigVvZa', 'staff', false, NULL, NOW(), NOW()),
('a0000001-0000-0000-0000-000000000006', 'John Mukasa', 'john@example.com', '+256700100001', '$2b$12$KddyygXOvn/.IPpI8LPE7O9uFPKkMaIwr8sX8MtYvJQ3CcxigVvZa', 'member', true, NOW(), NOW(), NOW()),
('a0000001-0000-0000-0000-000000000007', 'Grace Nambi', 'grace@example.com', '+256700100002', '$2b$12$KddyygXOvn/.IPpI8LPE7O9uFPKkMaIwr8sX8MtYvJQ3CcxigVvZa', 'member', true, NOW()-interval '3 days', NOW(), NOW()),
('a0000001-0000-0000-0000-000000000008', 'Tom Inactive', 'tom@iffeds.org', '+256700000006', '$2b$12$KddyygXOvn/.IPpI8LPE7O9uFPKkMaIwr8sX8MtYvJQ3CcxigVvZa', 'staff', false, NULL, NOW(), NOW());

-- ===== MEMBERS (16) =====
INSERT INTO members (id, "memberId", "firstName", "lastName", email, phone, gender, "nationalId", occupation, city, district, country, status, "joinDate", "userId", "createdAt", "updatedAt") VALUES
('b0000001-0000-0000-0000-000000000001', 'IFFE-001', 'John', 'Mukasa', 'john@example.com', '+256700100001', 'male', 'CM000001', 'Farmer', 'Kampala', 'Central', 'UG', 'active', NOW()-interval '180 days', 'a0000001-0000-0000-0000-000000000006', NOW(), NOW()),
('b0000001-0000-0000-0000-000000000002', 'IFFE-002', 'Grace', 'Nambi', 'grace@example.com', '+256700100002', 'female', 'CM000002', 'Teacher', 'Entebbe', 'Wakiso', 'UG', 'active', NOW()-interval '160 days', 'a0000001-0000-0000-0000-000000000007', NOW(), NOW()),
('b0000001-0000-0000-0000-000000000003', 'IFFE-003', 'Peter', 'Ochieng', 'peter@example.com', '+256700100003', 'male', NULL, 'Engineer', 'Jinja', 'Jinja', 'UG', 'active', NOW()-interval '150 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000004', 'IFFE-004', 'Sarah', 'Auma', 'sarah@example.com', '+256700100004', 'female', NULL, 'Nurse', 'Gulu', 'Gulu', 'UG', 'pending', NOW()-interval '10 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000005', 'IFFE-005', 'David', 'Kibet', 'david@example.com', '+256700100005', 'male', NULL, 'Businessman', 'Mbale', 'Mbale', 'UG', 'active', NOW()-interval '120 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000006', 'IFFE-006', 'Mary', 'Wanjiku', 'mary@example.com', '+256700100006', 'female', NULL, 'Accountant', 'Kampala', 'Central', 'UG', 'active', NOW()-interval '100 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000007', 'IFFE-007', 'James', 'Otieno', 'james@example.com', '+256700100007', 'male', NULL, 'Driver', 'Kampala', 'Central', 'UG', 'inactive', NOW()-interval '200 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000008', 'IFFE-008', 'Agnes', 'Namutebi', 'agnes@example.com', '+256700100008', 'female', NULL, 'Trader', 'Kampala', 'Central', 'UG', 'active', NOW()-interval '90 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000009', 'IFFE-009', 'Robert', 'Kamau', 'robert@example.com', '+256700100009', 'male', NULL, 'Lawyer', 'Kampala', 'Central', 'UG', 'active', NOW()-interval '80 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000010', 'IFFE-010', 'Florence', 'Achieng', 'florence@example.com', '+256700100010', 'female', NULL, 'Doctor', 'Kampala', 'Central', 'UG', 'active', NOW()-interval '70 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000011', 'IFFE-011', 'Joseph', 'Nsubuga', 'joseph@example.com', '+256700100011', 'male', NULL, 'Mechanic', 'Mukono', 'Mukono', 'UG', 'active', NOW()-interval '60 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000012', 'IFFE-012', 'Elizabeth', 'Kendi', 'elizabeth@example.com', '+256700100012', 'female', NULL, 'Student', 'Kampala', 'Central', 'UG', 'pending', NOW()-interval '5 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000013', 'IFFE-013', 'Charles', 'Okello', 'charles@example.com', '+256700100013', 'male', NULL, 'Electrician', 'Lira', 'Lira', 'UG', 'active', NOW()-interval '50 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000014', 'IFFE-014', 'Diana', 'Akoth', 'diana@example.com', '+256700100014', 'female', NULL, 'Chef', 'Kampala', 'Central', 'UG', 'active', NOW()-interval '45 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000015', 'IFFE-015', 'Patrick', 'Were', 'patrick@example.com', '+256700100015', 'male', NULL, 'Pilot', 'Entebbe', 'Wakiso', 'UG', 'suspended', NOW()-interval '30 days', NULL, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000016', 'IFFE-016', 'Betty', 'Namugenyi', 'betty@example.com', '+256700100016', 'female', NULL, 'Pharmacist', 'Kampala', 'Central', 'UG', 'pending', NOW()-interval '3 days', NULL, NOW(), NOW());

-- ===== ACCOUNTS (20) =====
INSERT INTO accounts (id, "accountNo", "memberId", type, balance, "interestRate", status, "lastActivity", "createdAt", "updatedAt") VALUES
('c0000001-0000-0000-0000-000000000001', 'SAV-0001', 'b0000001-0000-0000-0000-000000000001', 'savings', 2500000, 12, 'active', NOW()-interval '1 day', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000002', 'FIX-0002', 'b0000001-0000-0000-0000-000000000002', 'fixed_deposit', 5800000, 15, 'active', NOW()-interval '2 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000003', 'SAV-0003', 'b0000001-0000-0000-0000-000000000003', 'savings', 3200000, 12, 'active', NOW()-interval '1 day', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000004', 'CUR-0004', 'b0000001-0000-0000-0000-000000000004', 'current', 500000, 5, 'active', NOW()-interval '5 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000005', 'SAV-0005', 'b0000001-0000-0000-0000-000000000005', 'savings', 4100000, 12, 'active', NOW()-interval '3 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000006', 'SAV-0006', 'b0000001-0000-0000-0000-000000000006', 'savings', 750000, 12, 'active', NOW()-interval '4 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000007', 'SAV-0007', 'b0000001-0000-0000-0000-000000000007', 'savings', 0, 12, 'dormant', NOW()-interval '60 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000008', 'CUR-0008', 'b0000001-0000-0000-0000-000000000008', 'current', 1200000, 5, 'active', NOW()-interval '2 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000009', 'SAV-0009', 'b0000001-0000-0000-0000-000000000009', 'savings', 5600000, 12, 'active', NOW()-interval '1 day', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000010', 'SAV-0010', 'b0000001-0000-0000-0000-000000000010', 'savings', 980000, 12, 'frozen', NOW()-interval '20 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000011', 'SAV-0011', 'b0000001-0000-0000-0000-000000000011', 'savings', 2300000, 12, 'active', NOW()-interval '3 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000012', 'SAV-0012', 'b0000001-0000-0000-0000-000000000012', 'savings', 150000, 12, 'active', NOW()-interval '5 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000013', 'SAV-0013', 'b0000001-0000-0000-0000-000000000013', 'savings', 3800000, 12, 'active', NOW()-interval '2 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000014', 'FIX-0014', 'b0000001-0000-0000-0000-000000000014', 'fixed_deposit', 8200000, 15, 'active', NOW()-interval '7 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000015', 'CUR-0015', 'b0000001-0000-0000-0000-000000000015', 'current', 0, 5, 'closed', NOW()-interval '30 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000016', 'SAV-0016', 'b0000001-0000-0000-0000-000000000016', 'savings', 100000, 12, 'active', NOW()-interval '3 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000017', 'SAV-0017', 'b0000001-0000-0000-0000-000000000001', 'savings', 1500000, 12, 'active', NOW()-interval '1 day', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000018', 'FIX-0018', 'b0000001-0000-0000-0000-000000000005', 'fixed_deposit', 10000000, 15, 'active', NOW()-interval '5 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000019', 'CUR-0019', 'b0000001-0000-0000-0000-000000000009', 'current', 950000, 5, 'active', NOW()-interval '2 days', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000020', 'SAV-0020', 'b0000001-0000-0000-0000-000000000013', 'savings', 2100000, 12, 'active', NOW()-interval '1 day', NOW(), NOW());

-- ===== TRANSACTIONS (40) — spread over 40 days for charts =====
INSERT INTO transactions (id, "accountId", type, amount, method, status, description, reference, "processedBy", "createdAt", "updatedAt") VALUES
('d001', 'c0000001-0000-0000-0000-000000000001', 'deposit', 500000, 'cash', 'completed', 'Cash deposit', 'REF-000001', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '40 days', NOW()),
('d002', 'c0000001-0000-0000-0000-000000000002', 'withdrawal', 200000, 'mobile_money', 'completed', 'Mobile money withdrawal', 'REF-000002', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '39 days', NOW()),
('d003', 'c0000001-0000-0000-0000-000000000003', 'loan_repayment', 350000, 'bank_transfer', 'completed', 'Monthly loan repayment', 'REF-000003', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '38 days', NOW()),
('d004', 'c0000001-0000-0000-0000-000000000004', 'deposit', 1000000, 'cash', 'pending', 'Large cash deposit', 'REF-000004', NULL, NOW()-interval '37 days', NOW()),
('d005', 'c0000001-0000-0000-0000-000000000005', 'withdrawal', 150000, 'cash', 'completed', 'Cash withdrawal', 'REF-000005', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '36 days', NOW()),
('d006', 'c0000001-0000-0000-0000-000000000006', 'deposit', 300000, 'mobile_money', 'completed', 'Mobile money deposit', 'REF-000006', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '35 days', NOW()),
('d007', 'c0000001-0000-0000-0000-000000000007', 'transfer', 250000, 'internal', 'completed', 'Internal transfer', 'REF-000007', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '34 days', NOW()),
('d008', 'c0000001-0000-0000-0000-000000000008', 'deposit', 800000, 'bank_transfer', 'completed', 'Bank transfer deposit', 'REF-000008', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '33 days', NOW()),
('d009', 'c0000001-0000-0000-0000-000000000009', 'loan_disbursement', 5000000, 'bank_transfer', 'completed', 'Business loan disbursement', 'REF-000009', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '32 days', NOW()),
('d010', 'c0000001-0000-0000-0000-000000000010', 'withdrawal', 100000, 'cash', 'rejected', 'Rejected - frozen account', 'REF-000010', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '31 days', NOW()),
('d011', 'c0000001-0000-0000-0000-000000000011', 'deposit', 450000, 'mobile_money', 'completed', 'Monthly savings', 'REF-000011', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '30 days', NOW()),
('d012', 'c0000001-0000-0000-0000-000000000012', 'loan_repayment', 280000, 'cash', 'completed', 'Loan repayment', 'REF-000012', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '29 days', NOW()),
('d013', 'c0000001-0000-0000-0000-000000000013', 'deposit', 650000, 'mobile_money', 'pending', 'Pending deposit', 'REF-000013', NULL, NOW()-interval '28 days', NOW()),
('d014', 'c0000001-0000-0000-0000-000000000014', 'withdrawal', 300000, 'cash', 'pending', 'Pending withdrawal', 'REF-000014', NULL, NOW()-interval '27 days', NOW()),
('d015', 'c0000001-0000-0000-0000-000000000001', 'deposit', 750000, 'bank_transfer', 'completed', 'Bank deposit', 'REF-000015', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '26 days', NOW()),
('d016', 'c0000001-0000-0000-0000-000000000003', 'fee', 25000, 'internal', 'completed', 'Monthly maintenance fee', 'REF-000016', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '25 days', NOW()),
('d017', 'c0000001-0000-0000-0000-000000000005', 'deposit', 1200000, 'mobile_money', 'completed', 'Large mobile deposit', 'REF-000017', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '24 days', NOW()),
('d018', 'c0000001-0000-0000-0000-000000000006', 'withdrawal', 180000, 'cash', 'completed', 'Cash withdrawal', 'REF-000018', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '23 days', NOW()),
('d019', 'c0000001-0000-0000-0000-000000000009', 'interest_credit', 56000, 'internal', 'completed', 'Monthly interest credit', 'REF-000019', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '22 days', NOW()),
('d020', 'c0000001-0000-0000-0000-000000000011', 'deposit', 380000, 'cash', 'completed', 'Cash deposit', 'REF-000020', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '21 days', NOW()),
('d021', 'c0000001-0000-0000-0000-000000000001', 'deposit', 900000, 'mobile_money', 'completed', 'Monthly savings', 'REF-000021', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '20 days', NOW()),
('d022', 'c0000001-0000-0000-0000-000000000008', 'withdrawal', 500000, 'bank_transfer', 'pending', 'Pending bank transfer', 'REF-000022', NULL, NOW()-interval '19 days', NOW()),
('d023', 'c0000001-0000-0000-0000-000000000013', 'deposit', 420000, 'cash', 'completed', 'Cash deposit', 'REF-000023', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '18 days', NOW()),
('d024', 'c0000001-0000-0000-0000-000000000003', 'loan_repayment', 350000, 'cash', 'completed', 'Monthly repayment', 'REF-000024', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '17 days', NOW()),
('d025', 'c0000001-0000-0000-0000-000000000005', 'deposit', 550000, 'mobile_money', 'completed', 'Mobile deposit', 'REF-000025', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '16 days', NOW()),
('d026', 'c0000001-0000-0000-0000-000000000002', 'withdrawal', 400000, 'cash', 'completed', 'Cash withdrawal', 'REF-000026', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '15 days', NOW()),
('d027', 'c0000001-0000-0000-0000-000000000011', 'deposit', 320000, 'bank_transfer', 'pending', 'Pending deposit', 'REF-000027', NULL, NOW()-interval '14 days', NOW()),
('d028', 'c0000001-0000-0000-0000-000000000009', 'transfer', 150000, 'internal', 'completed', 'Transfer between accounts', 'REF-000028', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '13 days', NOW()),
('d029', 'c0000001-0000-0000-0000-000000000001', 'deposit', 680000, 'cash', 'completed', 'Cash deposit', 'REF-000029', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '12 days', NOW()),
('d030', 'c0000001-0000-0000-0000-000000000006', 'withdrawal', 200000, 'mobile_money', 'rejected', 'Rejected - insufficient balance', 'REF-000030', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '11 days', NOW()),
('d031', 'c0000001-0000-0000-0000-000000000013', 'deposit', 500000, 'cash', 'completed', 'Regular deposit', 'REF-000031', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '10 days', NOW()),
('d032', 'c0000001-0000-0000-0000-000000000005', 'deposit', 850000, 'bank_transfer', 'completed', 'Bank deposit', 'REF-000032', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '9 days', NOW()),
('d033', 'c0000001-0000-0000-0000-000000000008', 'withdrawal', 250000, 'cash', 'completed', 'Cash withdrawal', 'REF-000033', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '8 days', NOW()),
('d034', 'c0000001-0000-0000-0000-000000000001', 'deposit', 1100000, 'mobile_money', 'pending', 'Large pending deposit', 'REF-000034', NULL, NOW()-interval '7 days', NOW()),
('d035', 'c0000001-0000-0000-0000-000000000003', 'loan_repayment', 350000, 'cash', 'completed', 'Monthly repayment', 'REF-000035', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '6 days', NOW()),
('d036', 'c0000001-0000-0000-0000-000000000011', 'deposit', 600000, 'mobile_money', 'completed', 'Savings deposit', 'REF-000036', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '5 days', NOW()),
('d037', 'c0000001-0000-0000-0000-000000000009', 'withdrawal', 350000, 'bank_transfer', 'completed', 'Bank transfer out', 'REF-000037', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '4 days', NOW()),
('d038', 'c0000001-0000-0000-0000-000000000005', 'deposit', 470000, 'cash', 'reversed', 'Reversed - duplicate entry', 'REF-000038', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '3 days', NOW()),
('d039', 'c0000001-0000-0000-0000-000000000001', 'interest_credit', 25000, 'internal', 'completed', 'Quarterly interest', 'REF-000039', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '2 days', NOW()),
('d040', 'c0000001-0000-0000-0000-000000000013', 'deposit', 750000, 'mobile_money', 'completed', 'Mobile money deposit', 'REF-000040', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '1 day', NOW());

-- ===== LOANS (16) =====
INSERT INTO loans (id, "memberId", type, amount, balance, "interestRate", term, "monthlyPayment", "nextPaymentDate", status, "approvedBy", "disbursedAt", "createdAt", "updatedAt") VALUES
('e001', 'b0000001-0000-0000-0000-000000000001', 'business', 5000000, 3200000, 12, 24, 235000, NOW()+interval '3 days', 'active', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '90 days', NOW(), NOW()),
('e002', 'b0000001-0000-0000-0000-000000000002', 'personal', 2000000, 1400000, 15, 12, 181000, NOW()+interval '5 days', 'active', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '60 days', NOW(), NOW()),
('e003', 'b0000001-0000-0000-0000-000000000003', 'emergency', 1000000, 600000, 10, 6, 172000, NOW()+interval '8 days', 'active', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '45 days', NOW(), NOW()),
('e004', 'b0000001-0000-0000-0000-000000000004', 'business', 8000000, 8000000, 12, 36, 266000, NULL, 'pending', NULL, NULL, NOW()-interval '5 days', NOW()),
('e005', 'b0000001-0000-0000-0000-000000000005', 'personal', 3000000, 0, 15, 12, 271000, NULL, 'paid', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '365 days', NOW(), NOW()),
('e006', 'b0000001-0000-0000-0000-000000000006', 'education', 4000000, 2800000, 8, 18, 238000, NOW()+interval '15 days', 'active', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '120 days', NOW(), NOW()),
('e007', 'b0000001-0000-0000-0000-000000000007', 'emergency', 500000, 250000, 10, 3, 173000, NOW()-interval '5 days', 'overdue', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '80 days', NOW(), NOW()),
('e008', 'b0000001-0000-0000-0000-000000000008', 'business', 10000000, 7500000, 12, 24, 470000, NOW()+interval '20 days', 'active', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '100 days', NOW(), NOW()),
('e009', 'b0000001-0000-0000-0000-000000000009', 'housing', 15000000, 12000000, 10, 36, 484000, NOW()+interval '10 days', 'active', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '150 days', NOW(), NOW()),
('e010', 'b0000001-0000-0000-0000-000000000010', 'personal', 1500000, 1500000, 15, 6, 265000, NULL, 'pending', NULL, NULL, NOW()-interval '3 days', NOW()),
('e011', 'b0000001-0000-0000-0000-000000000011', 'business', 6000000, 6000000, 12, 24, 282000, NULL, 'rejected', NULL, NULL, NOW()-interval '15 days', NOW()),
('e012', 'b0000001-0000-0000-0000-000000000012', 'education', 2500000, 2500000, 8, 12, 218000, NULL, 'pending', NULL, NULL, NOW()-interval '2 days', NOW()),
('e013', 'b0000001-0000-0000-0000-000000000013', 'emergency', 800000, 400000, 10, 6, 138000, NOW()+interval '12 days', 'active', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '60 days', NOW(), NOW()),
('e014', 'b0000001-0000-0000-0000-000000000014', 'personal', 1200000, 0, 15, 6, 212000, NULL, 'paid', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '200 days', NOW(), NOW()),
('e015', 'b0000001-0000-0000-0000-000000000001', 'education', 3500000, 800000, 8, 12, 304000, NOW()+interval '7 days', 'active', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '300 days', NOW(), NOW()),
('e016', 'b0000001-0000-0000-0000-000000000005', 'business', 7000000, 7000000, 12, 24, 329000, NOW()-interval '30 days', 'defaulted', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '400 days', NOW(), NOW());

-- ===== EXPENSES (20) =====
INSERT INTO expenses (id, description, category, amount, date, "approvedBy", status, "createdAt", "updatedAt") VALUES
('f01', 'Staff Salaries - March 2026', 'Salaries', 4500000, NOW()-interval '5 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f02', 'Office Rent - March', 'Rent', 1200000, NOW()-interval '10 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f03', 'Internet & Phone', 'Utilities', 350000, NOW()-interval '15 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f04', 'Marketing Campaign Q1', 'Marketing', 800000, NOW()-interval '8 days', NULL, 'pending', NOW(), NOW()),
('f05', 'Office Supplies', 'Operations', 150000, NOW()-interval '12 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f06', 'System Maintenance', 'IT', 500000, NOW()-interval '18 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f07', 'Transport Allowances', 'Operations', 280000, NOW()-interval '20 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f08', 'Training Workshop', 'Training', 650000, NOW()-interval '7 days', NULL, 'pending', NOW(), NOW()),
('f09', 'Staff Salaries - February', 'Salaries', 4500000, NOW()-interval '35 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f10', 'Office Rent - February', 'Rent', 1200000, NOW()-interval '40 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f11', 'Generator Fuel', 'Utilities', 120000, NOW()-interval '22 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f12', 'Business Cards Printing', 'Marketing', 80000, NOW()-interval '25 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f13', 'Security Services', 'Operations', 400000, NOW()-interval '30 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f14', 'Software Licenses', 'IT', 750000, NOW()-interval '3 days', NULL, 'pending', NOW(), NOW()),
('f15', 'Annual Audit Fee', 'Operations', 2000000, NOW()-interval '45 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f16', 'Water & Electricity', 'Utilities', 180000, NOW()-interval '28 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f17', 'Team Building Event', 'Training', 350000, NOW()-interval '14 days', 'a0000001-0000-0000-0000-000000000001', 'rejected', NOW(), NOW()),
('f18', 'Insurance Premium', 'Insurance', 1500000, NOW()-interval '50 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f19', 'Legal Consultation', 'Operations', 600000, NOW()-interval '33 days', 'a0000001-0000-0000-0000-000000000001', 'approved', NOW(), NOW()),
('f20', 'Social Media Ads', 'Marketing', 200000, NOW()-interval '2 days', NULL, 'pending', NOW(), NOW());

-- ===== DEPOSIT REQUESTS (10) =====
INSERT INTO deposit_requests (id, "memberId", "accountId", amount, method, description, status, "processedBy", "createdAt", "updatedAt") VALUES
('g01', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 500000, 'mobile_money', 'Monthly savings deposit', 'pending', NULL, NOW()-interval '2 days', NOW()),
('g02', 'b0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000003', 1200000, 'bank_transfer', 'Project payment received', 'pending', NULL, NOW()-interval '3 days', NOW()),
('g03', 'b0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000005', 350000, 'cash', 'Cash deposit at branch', 'pending', NULL, NOW()-interval '1 day', NOW()),
('g04', 'b0000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000008', 800000, 'mobile_money', 'Business income deposit', 'pending', NULL, NOW()-interval '4 days', NOW()),
('g05', 'b0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', 2000000, 'bank_transfer', 'Term deposit top-up', 'approved', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '5 days', NOW()),
('g06', 'b0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000006', 150000, 'cash', 'Small savings', 'approved', 'a0000001-0000-0000-0000-000000000003', NOW()-interval '6 days', NOW()),
('g07', 'b0000001-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000009', 950000, 'mobile_money', 'Regular deposit', 'approved', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '8 days', NOW()),
('g08', 'b0000001-0000-0000-0000-000000000011', 'c0000001-0000-0000-0000-000000000011', 400000, 'cash', 'Cash deposit', 'approved', 'a0000001-0000-0000-0000-000000000003', NOW()-interval '9 days', NOW()),
('g09', 'b0000001-0000-0000-0000-000000000013', 'c0000001-0000-0000-0000-000000000013', 600000, 'bank_transfer', 'Salary transfer', 'rejected', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '10 days', NOW()),
('g10', 'b0000001-0000-0000-0000-000000000014', 'c0000001-0000-0000-0000-000000000014', 100000, 'cash', 'Small deposit rejected', 'rejected', 'a0000001-0000-0000-0000-000000000003', NOW()-interval '12 days', NOW());

-- ===== WITHDRAW REQUESTS (10) =====
INSERT INTO withdraw_requests (id, "memberId", "accountId", amount, method, reason, status, "processedBy", "createdAt", "updatedAt") VALUES
('h01', 'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 200000, 'mobile_money', 'Emergency medical expense', 'pending', NULL, NOW()-interval '1 day', NOW()),
('h02', 'b0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000005', 500000, 'cash', 'School fees payment', 'pending', NULL, NOW()-interval '2 days', NOW()),
('h03', 'b0000001-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000009', 300000, 'bank_transfer', 'Business expense', 'pending', NULL, NOW()-interval '3 days', NOW()),
('h04', 'b0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', 150000, 'cash', 'Personal needs', 'approved', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '5 days', NOW()),
('h05', 'b0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000003', 400000, 'mobile_money', 'Rent payment', 'approved', 'a0000001-0000-0000-0000-000000000003', NOW()-interval '6 days', NOW()),
('h06', 'b0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000006', 100000, 'cash', 'Transport costs', 'approved', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '8 days', NOW()),
('h07', 'b0000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000008', 250000, 'bank_transfer', 'Supplier payment', 'approved', 'a0000001-0000-0000-0000-000000000003', NOW()-interval '9 days', NOW()),
('h08', 'b0000001-0000-0000-0000-000000000011', 'c0000001-0000-0000-0000-000000000011', 350000, 'cash', 'Equipment purchase', 'rejected', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '10 days', NOW()),
('h09', 'b0000001-0000-0000-0000-000000000013', 'c0000001-0000-0000-0000-000000000013', 800000, 'mobile_money', 'Large withdrawal - exceeds limit', 'rejected', 'a0000001-0000-0000-0000-000000000001', NOW()-interval '12 days', NOW()),
('h10', 'b0000001-0000-0000-0000-000000000014', 'c0000001-0000-0000-0000-000000000014', 50000, 'cash', 'Small cash withdrawal', 'rejected', 'a0000001-0000-0000-0000-000000000003', NOW()-interval '14 days', NOW());

-- ===== PAYMENT GATEWAYS (5) =====
INSERT INTO payment_gateways (id, name, type, currency, fee, "isActive") VALUES
('pg1', 'MTN Mobile Money', 'mobile_money', 'UGX', '1.5%', true),
('pg2', 'Airtel Money', 'mobile_money', 'UGX', '1.5%', true),
('pg3', 'Stanbic FlexiPay', 'bank', 'UGX', '0.5%', false),
('pg4', 'Visa/Mastercard', 'card', 'USD', '2.5%', false),
('pg5', 'PayPal', 'online', 'USD', '3.0%', false);

-- ===== WELFARE PROGRAMS (4) =====
INSERT INTO welfare_programs (id, name, description, "targetAmount", "raisedAmount", "contributorCount", status, "createdAt", "updatedAt") VALUES
('w1', 'Medical Emergency Fund', 'Emergency medical support for members and their families', 50000000, 32000000, 45, 'active', NOW()-interval '180 days', NOW()),
('w2', 'Education Scholarship', 'Supporting member children education through bursaries', 30000000, 18000000, 30, 'active', NOW()-interval '120 days', NOW()),
('w3', 'Bereavement Support', 'Financial support during loss of a family member', 20000000, 15000000, 55, 'active', NOW()-interval '365 days', NOW()),
('w4', 'Housing Support Fund', 'Help members with housing construction and improvements', 100000000, 45000000, 22, 'active', NOW()-interval '90 days', NOW());

-- ===== PLEDGES (25) =====
INSERT INTO pledges (id, "programId", "memberId", amount, status, "createdAt") VALUES
('p01', 'w1', 'b0000001-0000-0000-0000-000000000001', 500000, 'paid', NOW()-interval '60 days'),
('p02', 'w1', 'b0000001-0000-0000-0000-000000000002', 600000, 'paid', NOW()-interval '55 days'),
('p03', 'w1', 'b0000001-0000-0000-0000-000000000003', 700000, 'pledged', NOW()-interval '50 days'),
('p04', 'w1', 'b0000001-0000-0000-0000-000000000005', 400000, 'paid', NOW()-interval '45 days'),
('p05', 'w1', 'b0000001-0000-0000-0000-000000000006', 300000, 'pledged', NOW()-interval '40 days'),
('p06', 'w1', 'b0000001-0000-0000-0000-000000000008', 500000, 'cancelled', NOW()-interval '35 days'),
('p07', 'w2', 'b0000001-0000-0000-0000-000000000001', 400000, 'paid', NOW()-interval '90 days'),
('p08', 'w2', 'b0000001-0000-0000-0000-000000000003', 350000, 'pledged', NOW()-interval '85 days'),
('p09', 'w2', 'b0000001-0000-0000-0000-000000000005', 450000, 'paid', NOW()-interval '80 days'),
('p10', 'w2', 'b0000001-0000-0000-0000-000000000009', 300000, 'pledged', NOW()-interval '75 days'),
('p11', 'w2', 'b0000001-0000-0000-0000-000000000011', 250000, 'paid', NOW()-interval '70 days'),
('p12', 'w2', 'b0000001-0000-0000-0000-000000000013', 500000, 'cancelled', NOW()-interval '65 days'),
('p13', 'w3', 'b0000001-0000-0000-0000-000000000001', 200000, 'paid', NOW()-interval '200 days'),
('p14', 'w3', 'b0000001-0000-0000-0000-000000000002', 300000, 'paid', NOW()-interval '180 days'),
('p15', 'w3', 'b0000001-0000-0000-0000-000000000006', 150000, 'pledged', NOW()-interval '160 days'),
('p16', 'w3', 'b0000001-0000-0000-0000-000000000008', 250000, 'paid', NOW()-interval '140 days'),
('p17', 'w3', 'b0000001-0000-0000-0000-000000000010', 200000, 'pledged', NOW()-interval '120 days'),
('p18', 'w3', 'b0000001-0000-0000-0000-000000000014', 350000, 'paid', NOW()-interval '100 days'),
('p19', 'w4', 'b0000001-0000-0000-0000-000000000001', 1000000, 'pledged', NOW()-interval '60 days'),
('p20', 'w4', 'b0000001-0000-0000-0000-000000000005', 800000, 'paid', NOW()-interval '50 days'),
('p21', 'w4', 'b0000001-0000-0000-0000-000000000009', 1200000, 'pledged', NOW()-interval '40 days'),
('p22', 'w4', 'b0000001-0000-0000-0000-000000000003', 600000, 'paid', NOW()-interval '30 days'),
('p23', 'w4', 'b0000001-0000-0000-0000-000000000011', 500000, 'pledged', NOW()-interval '20 days'),
('p24', 'w4', 'b0000001-0000-0000-0000-000000000013', 700000, 'cancelled', NOW()-interval '15 days'),
('p25', 'w4', 'b0000001-0000-0000-0000-000000000008', 900000, 'paid', NOW()-interval '10 days');

-- ===== BANK ACCOUNTS (5) =====
INSERT INTO bank_accounts (id, "bankName", "accountName", "accountNo", branch, balance, status, "createdAt", "updatedAt") VALUES
('ba1', 'Stanbic Bank', 'IFFE SACCO Main Account', '9030012345678', 'Kampala Main', 125000000, 'active', NOW(), NOW()),
('ba2', 'DFCU Bank', 'IFFE SACCO Operations', '02012345678', 'Garden City', 45000000, 'active', NOW(), NOW()),
('ba3', 'Centenary Bank', 'IFFE SACCO Reserve', '34012345678', 'Entebbe Road', 80000000, 'active', NOW(), NOW()),
('ba4', 'Equity Bank', 'IFFE SACCO Loans Fund', '56012345678', 'Ndeeba Branch', 35000000, 'active', NOW(), NOW()),
('ba5', 'Bank of Africa', 'IFFE SACCO Savings Pool', '78012345678', 'City Square', 18000000, 'inactive', NOW(), NOW());

-- ===== SETTINGS (15) =====
INSERT INTO settings (id, key, value) VALUES
('s01', 'company_name', 'IFFE SACCO'),
('s02', 'tagline', 'Empowering Financial Freedom'),
('s03', 'email', 'info@iffeds.org'),
('s04', 'phone', '+256 700 000 000'),
('s05', 'currency', 'USh'),
('s06', 'currency_code', 'UGX'),
('s07', 'date_format', 'Y-m-d'),
('s08', 'language', 'en'),
('s09', 'timezone', 'Africa/Kampala'),
('s10', 'address', 'Plot 10, Kampala Road, Kampala, Uganda'),
('s11', 'min_savings_balance', '10000'),
('s12', 'max_daily_withdrawal', '5000000'),
('s13', 'loan_approval_required', 'true'),
('s14', 'two_factor_auth', 'false'),
('s15', 'session_timeout_minutes', '30');

-- ===== AUDIT LOGS (15) =====
INSERT INTO audit_logs (id, "userId", action, entity, "entityId", "ipAddress", "createdAt") VALUES
('al01', 'a0000001-0000-0000-0000-000000000001', 'login', 'user', 'a0000001-0000-0000-0000-000000000001', '192.168.1.10', NOW()-interval '15 days'),
('al02', 'a0000001-0000-0000-0000-000000000001', 'create_member', 'member', 'b0000001-0000-0000-0000-000000000001', '192.168.1.10', NOW()-interval '14 days'),
('al03', 'a0000001-0000-0000-0000-000000000001', 'approve_loan', 'loan', 'e001', '192.168.1.10', NOW()-interval '13 days'),
('al04', 'a0000001-0000-0000-0000-000000000003', 'create_transaction', 'transaction', 'd001', '192.168.1.15', NOW()-interval '12 days'),
('al05', 'a0000001-0000-0000-0000-000000000001', 'update_settings', 'setting', 's01', '192.168.1.10', NOW()-interval '11 days'),
('al06', 'a0000001-0000-0000-0000-000000000001', 'approve_expense', 'expense', 'f01', '192.168.1.10', NOW()-interval '10 days'),
('al07', 'a0000001-0000-0000-0000-000000000003', 'reject_withdrawal', 'withdraw_request', 'h08', '192.168.1.15', NOW()-interval '9 days'),
('al08', 'a0000001-0000-0000-0000-000000000001', 'create_member', 'member', 'b0000001-0000-0000-0000-000000000005', '192.168.1.10', NOW()-interval '8 days'),
('al09', 'a0000001-0000-0000-0000-000000000001', 'login', 'user', 'a0000001-0000-0000-0000-000000000001', '192.168.1.10', NOW()-interval '7 days'),
('al10', 'a0000001-0000-0000-0000-000000000003', 'approve_deposit', 'deposit_request', 'g05', '192.168.1.15', NOW()-interval '6 days'),
('al11', 'a0000001-0000-0000-0000-000000000001', 'deactivate_user', 'user', 'a0000001-0000-0000-0000-000000000005', '192.168.1.10', NOW()-interval '5 days'),
('al12', 'a0000001-0000-0000-0000-000000000001', 'create_loan', 'loan', 'e004', '192.168.1.10', NOW()-interval '4 days'),
('al13', 'a0000001-0000-0000-0000-000000000003', 'approve_transaction', 'transaction', 'd020', '192.168.1.15', NOW()-interval '3 days'),
('al14', 'a0000001-0000-0000-0000-000000000001', 'update_member', 'member', 'b0000001-0000-0000-0000-000000000009', '192.168.1.10', NOW()-interval '2 days'),
('al15', 'a0000001-0000-0000-0000-000000000001', 'login', 'user', 'a0000001-0000-0000-0000-000000000001', '10.0.0.1', NOW()-interval '1 day');
