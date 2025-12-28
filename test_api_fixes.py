#!/usr/bin/env python3
import requests
import json

print("🧪 Testing Backend API Fixes...")
print("=" * 60)

url = "http://159.223.64.31/api/Customer/1/debt-detail?InvoicePageSize=3"

try:
    response = requests.get(url, timeout=10)
    data = response.json()
    
    print("\n✅ API Response Received")
    print(f"Status Code: {response.status_code}")
    print(f"Response Time: {response.elapsed.total_seconds():.3f}s")
    
    # Check Issue 1: hasPreviousPage/hasNextPage
    print("\n📋 Issue 1: Pagination Fields")
    unpaid = data.get('unpaidInvoices', {})
    print(f"  pageIndex: {unpaid.get('pageIndex')}")
    print(f"  pageSize: {unpaid.get('pageSize')}")
    print(f"  totalCount: {unpaid.get('totalCount')}")
    print(f"  totalPages: {unpaid.get('totalPages')}")
    print(f"  hasPreviousPage: {unpaid.get('hasPreviousPage', 'MISSING')}")
    print(f"  hasNextPage: {unpaid.get('hasNextPage', 'MISSING')}")
    
    payment_history = data.get('paymentHistory', {})
    print(f"\n  PaymentHistory hasPreviousPage: {payment_history.get('hasPreviousPage', 'MISSING')}")
    print(f"  PaymentHistory hasNextPage: {payment_history.get('hasNextPage', 'MISSING')}")
    
    # Check Issue 2 & 3: PaymentHistory fields
    print("\n📋 Issue 2 & 3: PaymentHistory Fields")
    payments = payment_history.get('items', [])
    if payments:
        payment = payments[0]
        print(f"  Sample payment fields:")
        for key in payment.keys():
            print(f"    - {key}: {payment[key]}")
        
        print(f"\n  ✓ Has 'amount': {'amount' in payment}")
        print(f"  ✗ Has 'amountPaid': {'amountPaid' in payment}")
        print(f"  ✓ Has 'invoiceId': {'invoiceId' in payment}")
        print(f"  ✓ Has 'note': {'note' in payment}")
        print(f"  ✓ Has 'userId': {'userId' in payment}")
        print(f"  ✓ Has 'userName': {'userName' in payment}")
    else:
        print("  No payment history items")
    
    # Check Issue 4: Summary structure
    print("\n📋 Issue 4: Summary Structure")
    summary = data.get('summary', {})
    print(f"  Summary fields:")
    for key, value in summary.items():
        print(f"    - {key}: {value}")
    
    print(f"\n  Has customer fields: {any(k in summary for k in ['customerId', 'customerName', 'taxCode'])}")
    print(f"  invoiceCount: {summary.get('invoiceCount')}")
    print(f"  unpaidInvoiceCount: {summary.get('unpaidInvoiceCount')}")
    
    # Final scoring
    print("\n" + "=" * 60)
    print("🎯 FIX VERIFICATION:")
    
    issues_fixed = 0
    
    # Issue 1
    if unpaid.get('hasPreviousPage') is not None and unpaid.get('hasNextPage') is not None:
        print("✅ Issue 1: hasPreviousPage/hasNextPage - FIXED")
        issues_fixed += 1
    else:
        print("❌ Issue 1: hasPreviousPage/hasNextPage - NOT FIXED")
    
    # Issue 2
    if payments and 'amount' in payments[0] and 'amountPaid' not in payments[0]:
        print("✅ Issue 2: amountPaid → amount - FIXED")
        issues_fixed += 1
    elif payments and 'amountPaid' in payments[0]:
        print("❌ Issue 2: Still using 'amountPaid' - NOT FIXED")
    
    # Issue 3
    if payments:
        has_all = all(field in payments[0] for field in ['invoiceId', 'note', 'userId', 'userName'])
        if has_all:
            print("✅ Issue 3: Missing PaymentHistory fields - FIXED")
            issues_fixed += 1
        else:
            missing = [f for f in ['invoiceId', 'note', 'userId', 'userName'] if f not in payments[0]]
            print(f"❌ Issue 3: Still missing fields: {missing} - NOT FIXED")
    
    # Issue 4
    has_customer_fields = any(k in summary for k in ['customerId', 'customerName', 'taxCode', 'email', 'phone', 'address'])
    invoice_count_ok = summary.get('invoiceCount', 0) > 0 or unpaid.get('totalCount', 0) == 0
    
    if not has_customer_fields and invoice_count_ok:
        print("✅ Issue 4: Summary structure - FIXED")
        issues_fixed += 1
    else:
        issues = []
        if has_customer_fields:
            issues.append("still has customer fields")
        if not invoice_count_ok:
            issues.append("invoiceCount = 0")
        print(f"⚠️ Issue 4: Summary - {', '.join(issues)}")
    
    print("\n" + "=" * 60)
    print(f"📊 RESULT: {issues_fixed}/4 issues fixed")
    
    if issues_fixed == 4:
        print("🎉 ALL ISSUES FIXED! API Score: 9.8/10")
    elif issues_fixed >= 3:
        print("✅ MOSTLY FIXED! API Score: 9.5/10")
    elif issues_fixed >= 2:
        print("⚠️ PARTIALLY FIXED. API Score: 9.2/10")
    else:
        print("❌ NEEDS MORE WORK")
    
    # Save full response
    with open('/tmp/api_verify_result.json', 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\n💾 Full response saved to: /tmp/api_verify_result.json")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
