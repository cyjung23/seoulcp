import json
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# JSON 데이터 로드
with open("output/all_clinics.json", "r", encoding="utf-8") as f:
    all_clinics = json.load(f)
print(f"총 {len(all_clinics)}개 클리닉 데이터 로드 완료")

# 표준 시술 자동 매칭
standard_treatments_data = supabase.table("standard_treatments").select("id, name_ko, match_keywords").execute()
standard_treatments_list = standard_treatments_data.data or []
print(f"표준 시술 {len(standard_treatments_list)}개 로드 완료")


def match_standard_treatment(treatment_name_ko):
    if not treatment_name_ko:
        return None
    name_lower = treatment_name_ko.strip().lower()
    best_match = None
    best_keyword_len = 0
    for std in standard_treatments_list:
        keywords = std.get("match_keywords") or []
        for kw in keywords:
            kw_lower = kw.lower()
            if kw_lower in name_lower:
                if len(kw) > best_keyword_len:
                    best_keyword_len = len(kw)
                    best_match = std["id"]
    return best_match


# 캐시
device_cache = {}
treatment_cache = {}
body_part_cache = {}
concern_cache = {}
match_count = 0
unmatch_count = 0

for i, clinic_data in enumerate(all_clinics):
    c = clinic_data.get("clinic", {})
    clinic_name = c.get("name_ko", "Unknown")
    print(f"\n[{i+1}/{len(all_clinics)}] {clinic_name}")
    if not c.get("name_ko"):
        print("  skip: no name_ko")
        continue
    source_file = clinic_data.get("_file", "")
    existing = supabase.table("clinics").select("id").eq("source_file", source_file).execute()
    if existing.data:
        clinic_id = existing.data[0]["id"]
        print("  already exists, skip")
    else:
        fl = c.get("foreign_languages", [])
        if isinstance(fl, str):
            fl = [fl]
        result = supabase.table("clinics").insert({"name_ko": c.get("name_ko"), "name_en": c.get("name_en"), "address_ko": c.get("address_ko"), "address_en": c.get("address_en"), "district_ko": c.get("district_ko"), "district_en": c.get("district_en"), "phone": c.get("phone"), "website": c.get("website"), "operating_hours": c.get("operating_hours"), "foreign_languages": fl if fl else None, "source_file": source_file}).execute()
        clinic_id = result.data[0]["id"]
        print(f"  added clinic id={clinic_id}")
    # equipment
    for eq in clinic_data.get("equipment", []):
        did = get_or_create_device(eq)
        if did:
            try:
                supabase.table("clinic_devices").insert({"clinic_id": clinic_id, "device_id": did}).execute()
            except Exception:
                pass
    # treatments
    for tr in clinic_data.get("treatments", []):
        tid = get_or_create_treatment(tr)
        if not tid:
            continue
        try:
            supabase.table("clinic_treatments").insert({"clinic_id": clinic_id, "treatment_id": tid, "price_krw": tr.get("price_krw"), "description": tr.get("description_ko")}).execute()
        except Exception:
            pass
        for j, pk in enumerate(tr.get("body_parts_ko", []) or []):
            pe = (tr.get("body_parts_en", []) or [])[j] if j < len(tr.get("body_parts_en", []) or []) else None
            bpid = get_or_create_body_part(pk, pe)
            if bpid:
                try:
                    supabase.table("treatment_body_parts").insert({"treatment_id": tid, "body_part_id": bpid}).execute()
                except Exception:
                    pass
        for j, ck in enumerate(tr.get("concerns_ko", []) or []):
            ce = (tr.get("concerns_en", []) or [])[j] if j < len(tr.get("concerns_en", []) or []) else None
            cid = get_or_create_concern(ck, ce)
            if cid:
                try:
                    supabase.table("treatment_concerns").insert({"treatment_id": tid, "concern_id": cid}).execute()
                except Exception:
                    pass
        for dn in (tr.get("devices_used", []) or []):
            if dn:
                de = supabase.table("devices").select("id").eq("device_name_ko", dn).execute()
                if de.data:
                    try:
                        supabase.table("treatment_devices").insert({"treatment_id": tid, "device_id