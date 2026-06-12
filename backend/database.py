"""
database.py — SQLite setup and seeding for MedLabel Verify
"""

import aiosqlite
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "medlabel.db")

DEVICE_COUNTRY_FIELDS = {
    "Thermometer": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Lot Number", "Expiry Date", "UDI", "FDA-compliant labeling", "Rx Only", "Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Lot Number", "Expiry Date", "UDI", "UK Responsible Person", "UKCA marking", "Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Lot Number", "Expiry Date", "UDI", "Manufacturing License No.", "Import License No.", "Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Lot Number", "Expiry Date", "UDI", "MAH", "Japanese-language label", "Warnings"],
    },
    "Syringe": {
        "USA":   ["Device Name", "Manufacturer", "Lot Number", "Expiry Date", "Sterile Symbol", "Single Use Symbol", "UDI", "FDA labeling", "Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Lot Number", "Expiry Date", "Sterile Symbol", "Single Use Symbol", "UDI", "UK Responsible Person", "Warnings"],
        "India": ["Device Name", "Manufacturer", "Lot Number", "Expiry Date", "Sterile Symbol", "Import License No.", "CDSCO requirements", "Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Lot Number", "Expiry Date", "Sterile Symbol", "MAH", "Japanese labeling", "Warnings"],
    },
    "Blood Pressure Monitor": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "Intended Use", "Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "Intended Use", "Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "Importer details", "Intended Use", "Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese IFU", "Intended Use", "Warnings"],
    },
    "Pulse Oximeter": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "Intended Use", "Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "Intended Use", "Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "CDSCO requirements", "Intended Use", "Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese labeling", "Intended Use", "Warnings"],
    },
    "Stethoscope": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "UDI", "FDA labeling", "Intended Use", "Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "UK Responsible Person", "UKCA", "Intended Use", "Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "License Numbers", "Importer details", "Intended Use", "Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "MAH", "Japanese labeling", "Intended Use", "Warnings"],
    },
    "Glucometer": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "Intended Use", "Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "Intended Use", "Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "CDSCO requirements", "Intended Use", "Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese IFU", "Intended Use", "Warnings"],
    },
    "Nebulizer": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "Intended Use", "Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "Intended Use", "Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "Import License No.", "Intended Use", "Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese labeling", "Intended Use", "Warnings"],
    },
    "ECG Machine": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "Electrical Specifications", "Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "Electrical Specifications", "Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "CDSCO requirements", "Electrical Specifications", "Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese IFU", "Electrical Specifications", "Warnings"],
    },
    "Defibrillator": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "Energy Output", "Safety Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "Energy Output", "Safety Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "Import License No.", "Energy Output", "Safety Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese labeling", "Energy Output", "Safety Warnings"],
    },
    "Infusion Pump": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "Flow Rate Range", "Safety Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "Flow Rate Range", "Safety Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "CDSCO requirements", "Flow Rate Range", "Safety Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese IFU", "Flow Rate Range", "Safety Warnings"],
    },
    "Surgical Mask": {
        "USA":   ["Product Name", "Manufacturer", "Lot Number", "Expiry Date", "Single Use Symbol", "UDI", "FDA labeling", "Storage Conditions"],
        "UK":    ["Product Name", "Manufacturer", "Lot Number", "Expiry Date", "Single Use Symbol", "UKCA", "UK Responsible Person", "Storage Conditions"],
        "India": ["Product Name", "Manufacturer", "Lot Number", "Expiry Date", "Single Use Symbol", "License Numbers", "Import details", "Storage Conditions"],
        "Japan": ["Product Name", "Manufacturer", "Lot Number", "Expiry Date", "Single Use Symbol", "MAH", "Japanese labeling", "Storage Conditions"],
    },
    "Wheelchair": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "Maximum User Weight", "Safety Instructions"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "Maximum User Weight", "Safety Instructions"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "Import details", "Maximum User Weight", "Safety Instructions"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese labeling", "Maximum User Weight", "Safety Instructions"],
    },
    "Hearing Aid": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "Battery Type", "Safety Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "Battery Type", "Safety Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "CDSCO requirements", "Battery Type", "Safety Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese IFU", "Battery Type", "Safety Warnings"],
    },
    "MRI Machine": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "MRI Safety Warnings", "Electrical Specifications"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "MRI Safety Warnings", "Electrical Specifications"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "Import License No.", "MRI Safety Warnings", "Electrical Specifications"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese labeling", "MRI Safety Warnings", "Electrical Specifications"],
    },
    "X-Ray Machine": {
        "USA":   ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "FDA labeling", "Radiation Warning Symbol", "Safety Warnings"],
        "UK":    ["Device Name", "Manufacturer", "Model Number", "Serial Number", "UDI", "UKCA", "Radiation Warning Symbol", "Safety Warnings"],
        "India": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "License Numbers", "Import License No.", "Radiation Warning Symbol", "Safety Warnings"],
        "Japan": ["Device Name", "Manufacturer", "Model Number", "Serial Number", "MAH", "Japanese labeling", "Radiation Warning Symbol", "Safety Warnings"],
    },
}

DEVICES = [
    {
        "name": "Thermometer",
        "category": "Diagnostic",
        "image_url": "/images/devices/thermometer.jpg",
        "description": "Measures body temperature. Available as digital oral, ear (tympanic), or infrared types.",
        "warning": "Do not use if damaged or broken. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Syringe",
        "category": "Drug Delivery",
        "image_url": "/images/devices/syringe.jpg",
        "description": "Hollow needle used to inject substances into or withdraw fluids from the body.",
        "warning": "Single-use only. Do not reuse. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Blood Pressure Monitor",
        "category": "Diagnostic",
        "image_url": "/images/devices/blood_pressure_monitor.jpg",
        "description": "Measures systolic and diastolic blood pressure. Used to detect hypertension.",
        "warning": "Use the correct cuff size for accurate readings. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Pulse Oximeter",
        "category": "Diagnostic",
        "image_url": "/images/devices/pulse_oximeter.jpg",
        "description": "Non-invasive device that measures blood oxygen saturation (SpO2) levels.",
        "warning": "Readings may be inaccurate during poor circulation or excessive movement. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Stethoscope",
        "category": "Diagnostic",
        "image_url": "/images/devices/stethoscope.jpg",
        "description": "Acoustic medical device for listening to internal body sounds such as heartbeat and breathing.",
        "warning": "Clean before and after each patient use. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Glucometer",
        "category": "Diagnostic",
        "image_url": "/images/devices/glucometer.jpg",
        "description": "Portable device for measuring blood glucose levels. Essential for diabetes management.",
        "warning": "Use only compatible test strips. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Nebulizer",
        "category": "Respiratory",
        "image_url": "/images/devices/nebulizer.jpg",
        "description": "Converts liquid medication into a fine mist for inhalation. Used for asthma and COPD.",
        "warning": "Clean and disinfect after each use. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "ECG Machine",
        "category": "Cardiac",
        "image_url": "/images/devices/ecg_machine.jpg",
        "description": "Records the electrical activity of the heart over a period of time.",
        "warning": "Use only trained personnel for operation and interpretation. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Defibrillator",
        "category": "Emergency",
        "image_url": "/images/devices/defibrillator.jpg",
        "description": "Delivers a therapeutic dose of electrical energy to the heart during arrhythmia.",
        "warning": "Do not touch the patient during shock delivery. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Infusion Pump",
        "category": "Drug Delivery",
        "image_url": "/images/devices/infusion_pump.jpg",
        "description": "Infuses fluids, medication, or nutrients into a patient's circulatory system intravenously.",
        "warning": "Verify infusion settings before use. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Surgical Mask",
        "category": "Protective Equipment",
        "image_url": "/images/devices/surgical_mask.jpg",
        "description": "Disposable device that creates a physical barrier between the mouth/nose and contaminants.",
        "warning": "Single-use only. Replace if wet or damaged. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Wheelchair",
        "category": "Mobility Aid",
        "image_url": "/images/devices/wheelchair.jpg",
        "description": "Chair fitted with wheels, used by people who have difficulty walking due to illness, injury, or disability.",
        "warning": "Always engage brakes before transferring the user. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "Hearing Aid",
        "category": "Sensory Aid",
        "image_url": "/images/devices/hearing_aid.jpg",
        "description": "Small electronic device worn in or behind the ear to make sounds louder.",
        "warning": "Keep batteries away from children. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "MRI Machine",
        "category": "Imaging",
        "image_url": "/images/devices/mri_machine.jpg",
        "description": "Uses powerful magnets and radio waves to create detailed images of organs and tissues.",
        "warning": "Keep all ferromagnetic objects out of the MRI room. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
    {
        "name": "X-Ray Machine",
        "category": "Imaging",
        "image_url": "/images/devices/x_ray_machine.jpg",
        "description": "Uses ionizing radiation to produce images of the inside of the body.",
        "warning": "Avoid unnecessary radiation exposure. Use protective shielding. USA: Federal law restricts this device to sale by or on the order of a licensed healthcare practitioner. UK: Read instructions before use. India: Use only as directed by a qualified healthcare professional. Japan: Follow the accompanying instructions for safe operation.",
    },
]

async def get_db():
    return await aiosqlite.connect(DB_PATH)


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS devices (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL,
                category    TEXT NOT NULL,
                image_url   TEXT NOT NULL,
                description TEXT NOT NULL,
                warning     TEXT NOT NULL DEFAULT ''
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS country_requirements (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id       INTEGER NOT NULL,
                country         TEXT NOT NULL,
                required_fields TEXT NOT NULL,
                FOREIGN KEY (device_id) REFERENCES devices(id)
            )
        """)

        cursor = await db.execute("SELECT COUNT(*) FROM devices")
        count = (await cursor.fetchone())[0]
        if count == 0:
            for device in DEVICES:
                cursor = await db.execute(
                    "INSERT INTO devices (name, category, image_url, description, warning) VALUES (?, ?, ?, ?, ?)",
                    (device["name"], device["category"], device["image_url"], device["description"], device["warning"]),
                )
                device_id = cursor.lastrowid
                device_fields = DEVICE_COUNTRY_FIELDS.get(device["name"], {})
                for country, fields in device_fields.items():
                    await db.execute(
                        "INSERT INTO country_requirements (device_id, country, required_fields) VALUES (?, ?, ?)",
                        (device_id, country, json.dumps(fields)),
                    )
            await db.commit()


async def search_device(name: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM devices WHERE LOWER(name) LIKE ? ORDER BY id LIMIT 1",
            (f"%{name.lower()}%",),
        )
        row = await cursor.fetchone()
        if not row:
            return None
        device = dict(row)
        req_cursor = await db.execute(
            "SELECT country, required_fields FROM country_requirements WHERE device_id = ?",
            (device["id"],),
        )
        requirements = {}
        async for req_row in req_cursor:
            requirements[req_row["country"]] = json.loads(req_row["required_fields"])
        device["requirements"] = requirements
        return device


async def get_all_devices():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT name, category FROM devices ORDER BY name")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]