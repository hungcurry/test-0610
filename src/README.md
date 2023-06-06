Login Page

Header
  User
  Notice
  Setting
Sidebar
============================================================
  Main
    Dashboard
      select city & evse
      evse status (location / chargers)
      power
      ------
      total use time
      customers (member / business / vistor)
      income
      total used power
      total amount
      payment management
      power & times
      location type
============================================================
  Charger Management (+)
    Stations 
      Map
        Right Side bar (name / addr. / chargers status) View / Add / Edit button
      List
        Party / Country / City / Address / Name  / State / Publish (Table)
        Coordinates / img / Updated Time / directions / country_code / evses / operator / owner / time_zone / charging_when_closed / parking_type (detail)
        state /  / opening_times / energy_mix / byCompany (?)

        Station EVSE List (Header (img / name / gps / addr.))
          EVSE ID / Status / Last Updated (Table)
          floor level / directions / physical_reference / connectors / Hard Reset / Soft Reset / HMI Info(*1) (detail)

          coordinates / status_schedule / capabilities / images / parking_restrictions (x)

          connector
            id / standard / format / power_type / max_voltage / max_amperage / max_electric_power / tariff_ids
            terms_and_conditions (x)

          tariff
            country_code / party_id / id / currency / type / tariff_alt_text / elements
            tariff_alt_url / (x)

            element
              price_components
                type (energy / flat / parking_time / time) / price / vat / step_size
              restrictions
                start_time / end_time / start_date / end_date / min_kwh / max_kwh / min_current / max_current / min_power / max_power / max_duration /
                day_of_week
                reservation (x)
    ------
    Chargers
      EVSE ID / Status / Station / addr.(table) / Last Updated
      Update FW / Detail
============================================================
  Users (+)
    Customers
      Member
      Guest
    Administrator
============================================================
  Sessions (+)
    Chargers
    Management
============================================================