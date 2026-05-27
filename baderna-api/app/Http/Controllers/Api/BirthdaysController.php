<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BirthdaysController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $today = Carbon::today();

        $members = User::where('is_deleted', false)
            ->where('approval_status', 'approved')
            ->whereNotNull('birthday')
            ->get()
            ->map(function ($user) use ($today) {
                $birthday = Carbon::parse($user->birthday);
                $bDay   = $birthday->day;
                $bMonth = $birthday->month;
                $bYear  = $birthday->year;

                // Next occurrence of this birthday
                $nextBirthday = Carbon::createFromDate($today->year, $bMonth, $bDay);
                if ($nextBirthday->lt($today)) {
                    $nextBirthday->addYear();
                }

                $daysUntil = (int) $today->diffInDays($nextBirthday, false);
                if ($daysUntil < 0) $daysUntil = 0;
                $isToday = $daysUntil === 0;

                // Age: how old they turn/turned on their next birthday
                $ageAtNext = $nextBirthday->year - $bYear;
                // Current age (may be one less if birthday hasn't happened yet this year)
                $currentAge = $isToday ? $ageAtNext : $ageAtNext - 1;

                $hidden = (bool) $user->birthday_hidden;

                return [
                    'id'             => $user->id,
                    'nickname'       => $user->summoner_name ?? $user->name,
                    'name'           => $user->display_name ?: $user->name,
                    'avatarSrc'      => $user->avatar_src,
                    'slug'           => $user->slug,
                    'birthdayDay'    => $bDay,
                    'birthdayMonth'  => $bMonth,
                    'birthdayYear'   => $hidden ? null : $bYear,
                    'birthdayHidden' => $hidden,
                    'daysUntil'      => $daysUntil,
                    'isToday'        => $isToday,
                    'age'            => $hidden ? null : $currentAge,
                ];
            })
            ->sortBy('daysUntil')
            ->values();

        return response()->json($members);
    }
}
