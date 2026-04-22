"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customerNameBookingError, phoneBookingError } from "@/lib/booking/contact-validation";
import { buildCustomHourlySlots, buildDateRange, buildHourlySlots } from "@/lib/booking/utils";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/availability");
  }

  return { supabase, user };
}

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/availability?error=Admin access required");
  }

  return { supabase, user };
}

function mapBookingError(errorMessage: string) {
  if (
    errorMessage.includes("bookings_one_active_per_slot_idx") ||
    errorMessage.toLowerCase().includes("duplicate key value")
  ) {
    return "This slot is already booked. Please choose another time.";
  }

  return errorMessage;
}

export async function generateSlotsForDateAction(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  if (!date) return;

  const { supabase, user } = await requireAdmin();
  const defaultSlots = buildHourlySlots().map((slot) => ({
    slot_date: date,
    start_time: slot.start,
    end_time: slot.end,
    status: "available",
    created_by: user.id,
  }));

  const { error } = await supabase
    .from("time_slots")
    .upsert(defaultSlots, { onConflict: "slot_date,start_time,end_time" });

  if (error) {
    redirect(`/admin/availability?date=${date}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/availability");
  redirect(`/admin/availability?date=${date}`);
}

export async function generateDefaultSlotsForRangeAction(formData: FormData) {
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  if (!startDate || !endDate) return;

  const { supabase, user } = await requireAdmin();
  const dates = buildDateRange(startDate, endDate);
  const defaultHours = buildHourlySlots();

  const payload = dates.flatMap((date) =>
    defaultHours.map((slot) => ({
      slot_date: date,
      start_time: slot.start,
      end_time: slot.end,
      status: "available",
      created_by: user.id,
    })),
  );

  const { error } = await supabase.from("time_slots").upsert(payload, {
    onConflict: "slot_date,start_time,end_time",
  });

  if (error) {
    redirect(
      `/admin/availability?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin/availability");
  redirect(`/admin/availability?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
}

export async function generateCustomSlotsForRangeAction(formData: FormData) {
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const startHour = Number(formData.get("customStartHour") ?? "");
  const endHour = Number(formData.get("customEndHour") ?? "");

  if (!startDate || !endDate) return;

  const customHours = buildCustomHourlySlots(startHour, endHour);
  if (customHours.length === 0) {
    redirect(
      `/admin/availability?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&error=${encodeURIComponent("Invalid custom hour range")}`,
    );
  }

  const { supabase, user } = await requireAdmin();
  const dates = buildDateRange(startDate, endDate);
  const payload = dates.flatMap((date) =>
    customHours.map((slot) => ({
      slot_date: date,
      start_time: slot.start,
      end_time: slot.end,
      status: "available",
      created_by: user.id,
    })),
  );

  const { error } = await supabase.from("time_slots").upsert(payload, {
    onConflict: "slot_date,start_time,end_time",
  });

  if (error) {
    redirect(
      `/admin/availability?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin/availability");
  redirect(`/admin/availability?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
}

export async function updateSlotStatusAction(formData: FormData) {
  const slotId = String(formData.get("slotId") ?? "");
  const status = String(formData.get("status") ?? "");
  const date = String(formData.get("date") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!slotId || !status || !date) return;
  const { supabase } = await requireAdmin();

  if (status === "available") {
    const { data: activeBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("slot_id", slotId)
      .eq("status", "active")
      .maybeSingle();

    if (activeBooking) {
      const rangeParams =
        startDate && endDate
          ? `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
          : `date=${encodeURIComponent(date)}`;
      redirect(`/admin/availability?${rangeParams}&error=Cannot mark this slot available while an active booking exists`);
    }
  }

  const { error } = await supabase.from("time_slots").update({ status }).eq("id", slotId);

  if (error) {
    const rangeParams =
      startDate && endDate ? `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}` : `date=${encodeURIComponent(date)}`;
    redirect(`/admin/availability?${rangeParams}&error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/availability");
  revalidatePath("/availability");
  const rangeParams =
    startDate && endDate ? `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}` : `date=${encodeURIComponent(date)}`;
  redirect(`/admin/availability?${rangeParams}`);
}

export async function bookSlotAction(formData: FormData) {
  const slotId = String(formData.get("slotId") ?? "");
  const date = String(formData.get("date") ?? "");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const wantsFood = String(formData.get("foodPreference") ?? "") === "yes";
  const foodItems = formData
    .getAll("foodItems")
    .map((item) => String(item))
    .filter(Boolean);

  if (!slotId || !date) return;
  const nameErr = customerNameBookingError(customerName);
  if (nameErr) {
    redirect(`/availability?date=${date}&error=${encodeURIComponent(nameErr)}`);
  }
  const phoneErr = phoneBookingError(phone);
  if (phoneErr) {
    redirect(`/availability?date=${date}&error=${encodeURIComponent(phoneErr)}`);
  }
  if (wantsFood && foodItems.length === 0) {
    redirect(
      `/availability?date=${date}&error=${encodeURIComponent("Please select at least one food item or choose No for food preference")}`,
    );
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("book_slot", {
    p_slot_id: slotId,
    p_customer_name: customerName,
    p_phone: phone,
    p_contact_email: contactEmail || null,
    p_food_items: wantsFood ? foodItems : [],
  });

  if (error) {
    redirect(`/availability?date=${date}&error=${encodeURIComponent(mapBookingError(error.message))}`);
  }

  revalidatePath("/availability");
  redirect(`/availability?date=${date}&success=Slot booked successfully`);
}

export async function cancelBookingAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  const date = String(formData.get("date") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  if (!bookingId || !date) return;

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: bookingId });

  if (error) {
    const target = redirectTo || `/availability?date=${date}`;
    redirect(`${target}${target.includes("?") ? "&" : "?"}error=${encodeURIComponent(mapBookingError(error.message))}`);
  }

  revalidatePath("/availability");
  revalidatePath("/admin/availability");
  const target = redirectTo || `/availability?date=${date}`;
  redirect(`${target}${target.includes("?") ? "&" : "?"}success=Booking cancelled`);
}

export async function modifyBookingAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  const newSlotId = String(formData.get("newSlotId") ?? "");
  const date = String(formData.get("date") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  if (!bookingId || !newSlotId || !date) return;

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("modify_booking", {
    p_booking_id: bookingId,
    p_new_slot_id: newSlotId,
  });

  if (error) {
    const target = redirectTo || `/availability?date=${date}`;
    redirect(`${target}${target.includes("?") ? "&" : "?"}error=${encodeURIComponent(mapBookingError(error.message))}`);
  }

  revalidatePath("/availability");
  revalidatePath("/admin/availability");
  const target = redirectTo || `/availability?date=${date}`;
  redirect(`${target}${target.includes("?") ? "&" : "?"}success=Booking updated`);
}
